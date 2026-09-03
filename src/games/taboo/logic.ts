import { mulberry32, shuffle } from "../../lib/random";
import type { Player } from "../../types";
import { ROUNDS, blankScores } from "../shared";

export type TabooState = {
  phase: "clues" | "guess" | "result" | "match";
  round: number;
  seed: number;
  startIndex: number;
  describerId: string;
  targetWord: string;
  forbiddenWords: string[];
  clueBank: string[];
  selectedClues: string[];
  options: string[];
  guesses: Record<string, { choice: string; at: number }>;
  foul: boolean;
  scores: Record<string, number>;
};

export type TabooAction =
  | { type: "clueTap"; word: string }
  | { type: "guess"; choice: string; at: number }
  | { type: "timeout"; at: number }
  | { type: "next" };

const CLUES_MS = 9000;
const GUESS_MS = 11000;

export const TABOO_CLUES_MS = CLUES_MS;
export const TABOO_GUESS_MS = GUESS_MS;
const CLUES_N = 3;
const CLUE_BANK_N = 12;

type Entry = { word: string; forbidden: string[] };

const ENTRIES: Entry[] = [
  { word: "avión", forbidden: ["alas", "piloto", "vuelo"] },
  { word: "pizza", forbidden: ["queso", "horno", "pepperoni"] },
  { word: "perro", forbidden: ["ladrar", "cola", "dogo"] },
  { word: "gato", forbidden: ["maullar", "bigotes", "arenero"] },
  { word: "sol", forbidden: ["día", "calor", "estrella"] },
  { word: "luna", forbidden: ["noche", "estrella", "cráter"] },
  { word: "taza", forbidden: ["café", "té", "manija"] },
  { word: "reloj", forbidden: ["hora", "tiempo", "tic"] },
  { word: "celular", forbidden: ["pantalla", "WhatsApp", "teclado"] },
  { word: "mochila", forbidden: ["cremallera", "libro", "escuela"] },
  { word: "bicicleta", forbidden: ["rueda", "pedal", "carril"] },
  { word: "tren", forbidden: ["vía", "andén", "vagón"] },
  { word: "faro", forbidden: ["mar", "luz", "navegar"] },
  { word: "cactus", forbidden: ["espina", "desierto", "suculenta"] },
  { word: "robot", forbidden: ["cables", "IA", "metal"] },
  { word: "sirena", forbidden: ["cantar", "mar", "ola"] },
  { word: "dragón", forbidden: ["fuego", "alas", "tesoro"] },
  { word: "cámara", forbidden: ["foto", "zoom", "objetivo"] },
  { word: "helado", forbidden: ["conos", "frío", "vainilla"] },
  { word: "guitarra", forbidden: ["cuerdas", "acordes", "afinador"] },
  { word: "fútbol", forbidden: ["penal", "árbitro", "ofensiva"] },
  { word: "pizza", forbidden: ["harina", "masa", "horno"] },
  { word: "teléfono", forbidden: ["celular", "pantalla", "llamada"] },
];

const TARGETS = Array.from(new Set(ENTRIES.map((e) => e.word)));

function pickEntry(seed: number, round: number): Entry {
  const rand = mulberry32(seed + round * 991);
  const idx = Math.floor(rand() * ENTRIES.length);
  return ENTRIES[idx] ?? ENTRIES[0]!;
}

function pickOptions(seed: number, target: string): string[] {
  const rand = mulberry32(seed + target.length * 11);
  const pool = TARGETS.filter((w) => w !== target);
  const distractors = shuffle(pool, rand).slice(0, 3);
  return shuffle([target, ...distractors], rand).slice(0, 4);
}

function pickClueBank(seed: number, forbiddenWords: string[], target: string): string[] {
  const rand = mulberry32(seed + target.length * 7 + forbiddenWords.length * 13);
  const forbiddenSet = new Set(forbiddenWords);

  const global = Array.from(
    new Set([
      ...TARGETS,
      ...ENTRIES.flatMap((e) => e.forbidden),
      target,
      ...forbiddenWords,
    ]),
  ).filter((w) => w.trim());

  const allowed = global.filter((w) => !forbiddenSet.has(w));
  const allowedSample = shuffle(allowed, rand).slice(0, CLUE_BANK_N - forbiddenWords.length);
  const bank = shuffle([...forbiddenWords, ...allowedSample], rand).slice(0, CLUE_BANK_N);
  return bank;
}

export function initTaboo(seed: number, players: Player[]): TabooState {
  const startIndex = 0;
  const entry = pickEntry(seed, 1);
  const describerId = players[startIndex]?.id ?? players[0]?.id ?? "";
  return {
    phase: "clues",
    round: 1,
    seed,
    startIndex,
    describerId,
    targetWord: entry.word,
    forbiddenWords: entry.forbidden,
    clueBank: pickClueBank(seed, entry.forbidden, entry.word),
    selectedClues: [],
    options: pickOptions(seed, entry.word),
    guesses: {},
    foul: false,
    scores: blankScores(players),
  };
}

function closeGuess(state: TabooState, players: Player[]): TabooState {
  const correctIds: string[] = [];
  let minAt = Infinity;
  for (const player of players) {
    const g = state.guesses[player.id];
    if (!g) continue;
    if (g.choice !== state.targetWord) continue;
    correctIds.push(player.id);
    if (g.at < minAt) minAt = g.at;
  }

  const nextScores = { ...state.scores };
  for (const playerId of correctIds) {
    const at = state.guesses[playerId]?.at;
    if (at === undefined) continue;
    const points = at === minAt ? 3 : 2;
    nextScores[playerId] = (nextScores[playerId] ?? 0) + points;
  }

  const anyCorrect = correctIds.length > 0;
  if (anyCorrect) {
    nextScores[state.describerId] = (nextScores[state.describerId] ?? 0) + 1;
  }

  return { ...state, phase: "result", scores: nextScores };
}

export function reduceTaboo(
  state: TabooState,
  action: TabooAction,
  from: string,
  players: Player[],
): TabooState {
  switch (action.type) {
    case "clueTap": {
      if (state.phase !== "clues") return state;
      if (from !== state.describerId) return state;
      if (state.foul) return state;
      if (!state.clueBank.includes(action.word)) return state;
      if (state.selectedClues.includes(action.word)) return state;
      if (state.selectedClues.length >= CLUES_N) return state;

      const isForbidden = state.forbiddenWords.includes(action.word);
      if (isForbidden) {
        const nextScores = { ...state.scores };
        nextScores[state.describerId] = Math.max(0, (nextScores[state.describerId] ?? 0) - 2);
        return { ...state, foul: true, phase: "result", scores: nextScores };
      }

      const selectedClues = [...state.selectedClues, action.word];
      if (selectedClues.length >= CLUES_N) {
        return {
          ...state,
          phase: "guess",
          selectedClues,
          guesses: {},
        };
      }

      return { ...state, selectedClues };
    }
    case "guess": {
      if (state.phase !== "guess") return state;
      if (!state.options.includes(action.choice)) return state;
      if (state.guesses[from]) return state;
      const guesses = { ...state.guesses, [from]: { choice: action.choice, at: action.at } };
      const allAnswered = players.every((p) => guesses[p.id] !== undefined);
      const next = { ...state, guesses };
      if (allAnswered) return closeGuess(next, players);
      return next;
    }
    case "timeout": {
      if (state.phase === "clues") {
        return { ...state, phase: "guess", guesses: {}, foul: false };
      }
      if (state.phase === "guess") {
        return closeGuess(state, players);
      }
      return state;
    }
    case "next": {
      if (state.phase !== "result" && state.phase !== "match") return state;
      if (state.round >= ROUNDS) return { ...state, phase: "match" };
      const round = state.round + 1;
      const startIndex = (state.startIndex + 1) % Math.max(players.length, 1);
      const entry = pickEntry(state.seed, round);
      const describerId = players[startIndex]?.id ?? players[0]?.id ?? "";
      return {
        phase: "clues",
        round,
        seed: state.seed,
        startIndex,
        describerId,
        targetWord: entry.word,
        forbiddenWords: entry.forbidden,
        clueBank: pickClueBank(state.seed, entry.forbidden, entry.word),
        selectedClues: [],
        options: pickOptions(state.seed, entry.word),
        guesses: {},
        foul: false,
        scores: state.scores,
      };
    }
    default: {
      const _n: never = action;
      return _n;
    }
  }
}

