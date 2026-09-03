import { mulberry32 } from "../../lib/random";
import { fold } from "../../lib/random";
import type { Player } from "../../types";

export const SYLLABLES = [
  "ba",
  "ca",
  "cha",
  "da",
  "en",
  "es",
  "fa",
  "ga",
  "gua",
  "in",
  "ja",
  "la",
  "lla",
  "ma",
  "me",
  "mi",
  "mo",
  "na",
  "pa",
  "pe",
  "pi",
  "pla",
  "po",
  "ra",
  "re",
  "ri",
  "ro",
  "sa",
  "ta",
  "te",
  "ti",
  "tra",
  "tu",
  "va",
  "za",
  "ción",
  "ado",
  "ero",
  "ita",
  "ura",
];

export type BombaState = {
  phase: "play" | "over";
  turn: number;
  currentId: string;
  syllable: string;
  lives: Record<string, number>;
  used: string[];
  lastWord: string | null;
  lastFrom: string | null;
  turnMs: number;
  winnerId: string | null;
};

export type BombaAction =
  | { type: "word"; text: string }
  | { type: "timeout"; turn: number };

export function initBomba(seed: number, players: Player[]): BombaState {
  const lives: Record<string, number> = {};
  for (const p of players) lives[p.id] = 2;
  const rand = mulberry32(seed);
  const syllable = SYLLABLES[Math.floor(rand() * SYLLABLES.length)] ?? "ra";
  return {
    phase: "play",
    turn: 0,
    currentId: players[0]?.id ?? "",
    syllable,
    lives,
    used: [],
    lastWord: null,
    lastFrom: null,
    turnMs: 9000,
    winnerId: null,
  };
}

function nextAlive(players: Player[], lives: Record<string, number>, fromId: string): string {
  const idx = players.findIndex((p) => p.id === fromId);
  for (let i = 1; i <= players.length; i += 1) {
    const p = players[(idx + i) % players.length];
    if (p && (lives[p.id] ?? 0) > 0) return p.id;
  }
  return fromId;
}

function nextSyllable(seedish: number): string {
  const rand = mulberry32(seedish);
  return SYLLABLES[Math.floor(rand() * SYLLABLES.length)] ?? "la";
}

export function reduceBomba(
  state: BombaState,
  action: BombaAction,
  from: string,
  players: Player[],
): BombaState {
  if (state.phase !== "play") return state;
  switch (action.type) {
    case "word": {
      if (from !== state.currentId) return state;
      const word = fold(action.text).replace(/[^a-zñ]/g, "");
      if (word.length < 3) return state;
      if (!word.includes(fold(state.syllable))) return state;
      if (state.used.includes(word)) return state;
      const used = [...state.used, word];
      const nextId = nextAlive(players, state.lives, from);
      return {
        ...state,
        turn: state.turn + 1,
        currentId: nextId,
        syllable: nextSyllable(state.turn + word.length * 17),
        used,
        lastWord: word,
        lastFrom: from,
        turnMs: Math.max(5000, 9000 - Math.floor(state.turn / 3) * 400),
      };
    }
    case "timeout": {
      if (action.turn !== state.turn) return state;
      const lives = {
        ...state.lives,
        [state.currentId]: Math.max(0, (state.lives[state.currentId] ?? 0) - 1),
      };
      const alive = players.filter((p) => (lives[p.id] ?? 0) > 0);
      if (alive.length <= 1) {
        return {
          ...state,
          lives,
          phase: "over",
          winnerId: alive[0]?.id ?? null,
        };
      }
      const nextId = nextAlive(players, lives, state.currentId);
      return {
        ...state,
        lives,
        currentId: nextId,
        turn: state.turn + 1,
        syllable: nextSyllable(state.turn + 91),
        lastWord: null,
        lastFrom: state.currentId,
        turnMs: Math.max(5000, 9000 - Math.floor(state.turn / 3) * 400),
      };
    }
    default: {
      const _n: never = action;
      return _n;
    }
  }
}
