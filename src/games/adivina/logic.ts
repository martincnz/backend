import { mulberry32, shuffle } from "../../lib/random";
import type { Player } from "../../types";
import { ROUNDS, blankScores } from "../shared";

export type AdinvinaState = {
  phase: "ask" | "result" | "match";
  round: number;
  seed: number;
  entryWord: string;
  clues: string[];
  options: string[];
  answers: Record<string, { choice: string; at: number }>;
  scores: Record<string, number>;
};

export type AdinvinaAction =
  | { type: "answer"; choice: string; at: number }
  | { type: "timeout"; at: number }
  | { type: "next" };

export const ADIVINA_ASK_MS = 11000;

type Entry = { word: string; clues: string[] };

const ENTRIES: Entry[] = [
  { word: "Maradona", clues: ["Famoso", "Fútbol", "Argentina"] },
  { word: "Messi", clues: ["Famoso", "Fútbol", "Rosario"] },
  { word: "Einstein", clues: ["Famoso", "Ciencia", "Relatividad"] },
  { word: "Curie", clues: ["Famoso", "Ciencia", "Radioactividad"] },
  { word: "Avión", clues: ["Objeto", "Transporte", "Vuelo"] },
  { word: "Helado", clues: ["Objeto", "Postre", "Frío"] },
  { word: "Pizza", clues: ["Objeto", "Comida", "Horno"] },
  { word: "Perro", clues: ["Animal", "Mascota", "Ladra"] },
  { word: "Gato", clues: ["Animal", "Mascota", "Maúlla"] },
  { word: "Robot", clues: ["Objeto", "Tecnología", "Autómata"] },
  { word: "Teléfono", clues: ["Objeto", "Tecnología", "Pantalla"] },
  { word: "Tren", clues: ["Transporte", "Vías", "Andén"] },
  { word: "Faro", clues: ["Lugar", "Mar", "Luz"] },
  { word: "Cactus", clues: ["Planta", "Desierto", "Espinas"] },
  { word: "Sirena", clues: ["Ficción", "Mar", "Canta"] },
  { word: "Dragón", clues: ["Ficción", "Fuego", "Mito"] },
  { word: "Taza", clues: ["Objeto", "Hogar", "Bebida"] },
  { word: "Reloj", clues: ["Objeto", "Tiempo", "Tic-tac"] },
];

function pickEntry(seed: number, round: number): Entry {
  const rand = mulberry32(seed + round * 911);
  const idx = Math.floor(rand() * ENTRIES.length);
  return ENTRIES[idx] ?? ENTRIES[0]!;
}

function pickOptions(seed: number, answer: string): string[] {
  const rand = mulberry32(seed + answer.length * 19);
  const pool = ENTRIES.map((e) => e.word).filter((w) => w !== answer);
  const distractors = shuffle(pool, rand).slice(0, 3);
  return shuffle([answer, ...distractors], rand).slice(0, 4);
}

export function initAdinvina(seed: number, players: Player[]): AdinvinaState {
  const round = 1;
  const entry = pickEntry(seed, round);
  return {
    phase: "ask",
    round,
    seed,
    entryWord: entry.word,
    clues: entry.clues,
    options: pickOptions(seed, entry.word),
    answers: {},
    scores: blankScores(players),
  };
}

function close(state: AdinvinaState, players: Player[]): AdinvinaState {
  const correct: Array<{ id: string; at: number }> = [];
  let minAt = Infinity;
  for (const p of players) {
    const ans = state.answers[p.id];
    if (!ans) continue;
    if (ans.choice !== state.entryWord) continue;
    correct.push({ id: p.id, at: ans.at });
    if (ans.at < minAt) minAt = ans.at;
  }

  if (!correct.length) return { ...state, phase: "result" };

  const nextScores = { ...state.scores };
  for (const { id, at } of correct) {
    const points = at === minAt ? 3 : 2;
    nextScores[id] = (nextScores[id] ?? 0) + points;
  }
  return { ...state, phase: "result", scores: nextScores };
}

export function reduceAdinvina(
  state: AdinvinaState,
  action: AdinvinaAction,
  from: string,
  players: Player[],
): AdinvinaState {
  switch (action.type) {
    case "answer": {
      if (state.phase !== "ask") return state;
      if (!state.options.includes(action.choice)) return state;
      if (state.answers[from]) return state;
      const answers = { ...state.answers, [from]: { choice: action.choice, at: action.at } };
      const allAnswered = players.every((p) => answers[p.id] !== undefined);
      const next = { ...state, answers };
      if (allAnswered) return close(next, players);
      return next;
    }
    case "timeout": {
      if (state.phase !== "ask") return state;
      return close(state, players);
    }
    case "next": {
      if (state.phase !== "result" && state.phase !== "match") return state;
      if (state.round >= ROUNDS) return { ...state, phase: "match" };
      const round = state.round + 1;
      const entry = pickEntry(state.seed, round);
      return {
        phase: "ask",
        round,
        seed: state.seed,
        entryWord: entry.word,
        clues: entry.clues,
        options: pickOptions(state.seed, entry.word),
        answers: {},
        scores: state.scores,
      };
    }
    default: {
      const _n: never = action;
      return _n;
    }
  }
}

