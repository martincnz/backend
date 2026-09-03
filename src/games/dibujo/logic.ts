import { shuffle, mulberry32 } from "../../lib/random";
import type { Player } from "../../types";

export type Point = { x: number; y: number };
export type Stroke = {
  id: string;
  color: string;
  width: number;
  points: Point[];
};

export type DibujoState = {
  phase: "pick" | "draw" | "reveal";
  round: number;
  drawerId: string;
  options: string[];
  word: string | null;
  strokes: Stroke[];
  guesses: Array<{ from: string; text: string; ok: boolean }>;
  scores: Record<string, number>;
  seen: string[];
};

export type DibujoAction =
  | { type: "pick"; word: string }
  | { type: "stroke"; stroke: Stroke }
  | { type: "guess"; text: string }
  | { type: "next" };

export const DRAW_WORDS = [
  "avión",
  "nube",
  "valija",
  "pasaporte",
  "auriculares",
  "café",
  "ventana",
  "piloto",
  "montaña",
  "playa",
  "gato",
  "perro",
  "bicicleta",
  "helado",
  "guitarra",
  "fútbol",
  "pizza",
  "submarino",
  "dinosaurio",
  "paraguas",
  "cohete",
  "fantasma",
  "cactus",
  "volcán",
  "pingüino",
  "castillo",
  "robot",
  "sirena",
  "dragón",
  "globo",
  "tren",
  "faro",
  "taza",
  "mochila",
  "sol",
  "luna",
  "estrella",
  "tiburón",
  "mariposa",
  "árbol",
  "casa",
  "barco",
  "sombrero",
  "reloj",
  "cámara",
  "libro",
  "teléfono",
  "llave",
];

export function initDibujo(seed: number, players: Player[]): DibujoState {
  const scores: Record<string, number> = {};
  for (const p of players) scores[p.id] = 0;
  const drawerId = players[0]?.id ?? "";
  return {
    phase: "pick",
    round: 1,
    drawerId,
    options: pickOptions(seed, []),
    word: null,
    strokes: [],
    guesses: [],
    scores,
    seen: [],
  };
}

function pickOptions(seed: number, seen: string[]): string[] {
  const rand = mulberry32(seed + seen.length * 13);
  const pool = DRAW_WORDS.filter((w) => !seen.includes(w));
  const source = pool.length >= 3 ? pool : DRAW_WORDS;
  return shuffle(source, rand).slice(0, 3);
}

export function reduceDibujo(
  state: DibujoState,
  action: DibujoAction,
  from: string,
  players: Player[],
): DibujoState {
  switch (action.type) {
    case "pick": {
      if (state.phase !== "pick" || from !== state.drawerId) return state;
      if (!state.options.includes(action.word)) return state;
      return {
        ...state,
        phase: "draw",
        word: action.word,
        strokes: [],
        guesses: [],
      };
    }
    case "stroke": {
      if (state.phase !== "draw" || from !== state.drawerId) return state;
      const existing = state.strokes.find((s) => s.id === action.stroke.id);
      if (existing) {
        return {
          ...state,
          strokes: state.strokes.map((s) =>
            s.id === action.stroke.id ? action.stroke : s,
          ),
        };
      }
      return { ...state, strokes: [...state.strokes, action.stroke] };
    }
    case "guess": {
      if (state.phase !== "draw" || from === state.drawerId || !state.word) {
        return state;
      }
      const ok =
        action.text
          .normalize("NFD")
          .replace(/\p{M}/gu, "")
          .toLowerCase()
          .trim() ===
        state.word
          .normalize("NFD")
          .replace(/\p{M}/gu, "")
          .toLowerCase()
          .trim();
      const guesses = [...state.guesses, { from, text: action.text, ok }];
      if (!ok) return { ...state, guesses };
      const scores = { ...state.scores };
      scores[from] = (scores[from] ?? 0) + 2;
      scores[state.drawerId] = (scores[state.drawerId] ?? 0) + 1;
      return { ...state, guesses, scores, phase: "reveal" };
    }
    case "next": {
      if (state.phase !== "reveal" && state.phase !== "draw") return state;
      const idx = players.findIndex((p) => p.id === state.drawerId);
      const next = players[(idx + 1) % players.length];
      const seen = state.word ? [...state.seen, state.word] : state.seen;
      return {
        ...state,
        phase: "pick",
        round: state.round + 1,
        drawerId: next?.id ?? state.drawerId,
        options: pickOptions(state.round + 99, seen),
        word: null,
        strokes: [],
        guesses: [],
        seen,
      };
    }
    default: {
      const _n: never = action;
      return _n;
    }
  }
}
