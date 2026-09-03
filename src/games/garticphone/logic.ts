import { mulberry32, shuffle } from "../../lib/random";
import type { Player } from "../../types";
import type { Stroke } from "../dibujo/logic";
import { DRAW_WORDS } from "../dibujo/logic";
import { ROUNDS, blankScores } from "../shared";

export type GarticPhoneState = {
  phase: "draw" | "guess" | "result" | "match";
  round: number;
  seed: number;
  startIndex: number; // rotates who draws first each round
  stage: 0 | 1 | 2; // 0..1 draws, 2 draws, then everybody guesses
  drawerId: string;
  stageStartedAt: number;
  guessStartedAt: number;
  secretWord: string;
  options: string[];
  drawings: [Stroke[], Stroke[], Stroke[]];
  guesses: Record<string, { choice: string; at: number }>;
  scores: Record<string, number>;
};

export type GarticPhoneAction =
  | { type: "stroke"; stroke: Stroke }
  | { type: "guess"; choice: string; at: number }
  | { type: "timeout"; at: number }
  | { type: "next" };

const DRAW_MS = 7000;
const GUESS_MS = 10000;

export const GARTICPHONE_DRAW_MS = DRAW_MS;
export const GARTICPHONE_GUESS_MS = GUESS_MS;

function currentDrawerId(players: Player[], state: GarticPhoneState): string {
  const order = players.length === 3 ? players : players.slice(0, 3);
  const idx = (state.startIndex + state.stage) % Math.max(order.length, 1);
  return order[idx]?.id ?? players[0]?.id ?? "";
}

function pickSecret(seed: number, round: number, startIndex: number): string {
  const rand = mulberry32(seed + round * 997 + startIndex * 33);
  const idx = Math.floor(rand() * DRAW_WORDS.length);
  return DRAW_WORDS[idx] ?? "avión";
}

function pickOptions(seed: number, secretWord: string): string[] {
  const rand = mulberry32(seed + secretWord.length * 17);
  const pool = DRAW_WORDS.filter((w) => w !== secretWord);
  const shuffled = shuffle(pool, rand);
  const distractors = shuffled.slice(0, 3);
  return shuffle([secretWord, ...distractors], rand).slice(0, 4);
}

export function initGarticphone(seed: number, players: Player[]): GarticPhoneState {
  const startIndex = 0;
  const secretWord = pickSecret(seed, 1, startIndex);
  const options = pickOptions(seed, secretWord);
  const stage: 0 = 0;
  const drawerId = players[startIndex]?.id ?? players[0]?.id ?? "";
  return {
    phase: "draw",
    round: 1,
    seed,
    startIndex,
    stage,
    drawerId,
    stageStartedAt: Date.now(),
    guessStartedAt: 0,
    secretWord,
    options,
    drawings: [[], [], []],
    guesses: {},
    scores: blankScores(players),
  };
}

function replaceStroke(strokes: Stroke[], stroke: Stroke): Stroke[] {
  const existing = strokes.find((s) => s.id === stroke.id);
  if (existing) return strokes.map((s) => (s.id === stroke.id ? stroke : s));
  return [...strokes, stroke];
}

function closeGuess(state: GarticPhoneState, players: Player[]): GarticPhoneState {
  const correctIds: string[] = [];
  let minAt = Infinity;
  for (const player of players) {
    const g = state.guesses[player.id];
    if (!g) continue;
    if (g.choice !== state.secretWord) continue;
    correctIds.push(player.id);
    if (g.at < minAt) minAt = g.at;
  }
  if (!correctIds.length) {
    return { ...state, phase: "result" };
  }

  const nextScores = { ...state.scores };
  for (const playerId of correctIds) {
    const at = state.guesses[playerId]?.at;
    if (at === undefined) continue;
    const points = at === minAt ? 3 : 2;
    nextScores[playerId] = (nextScores[playerId] ?? 0) + points;
  }
  return {
    ...state,
    phase: "result",
    scores: nextScores,
  };
}

export function reduceGarticphone(
  state: GarticPhoneState,
  action: GarticPhoneAction,
  from: string,
  players: Player[],
): GarticPhoneState {
  switch (action.type) {
    case "stroke": {
      if (state.phase !== "draw") return state;
      if (from !== state.drawerId) return state;
      const idx = state.stage;
      const drawings = [...state.drawings] as [Stroke[], Stroke[], Stroke[]];
      drawings[idx] = replaceStroke(drawings[idx], action.stroke);
      return { ...state, drawings };
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
      if (state.phase === "draw") {
        const nextStage = (state.stage + 1) as 0 | 1 | 2 | 3;
        if (state.stage < 2) {
          const stage = nextStage as 0 | 1 | 2;
          const drawerId = currentDrawerId(players, { ...state, stage, drawerId: state.drawerId });
          return {
            ...state,
            stage,
            drawerId,
            stageStartedAt: action.at,
          };
        }
        return {
          ...state,
          phase: "guess",
          drawerId: state.drawerId,
          guessStartedAt: action.at,
        };
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
      const secretWord = pickSecret(state.seed, round, startIndex);
      const options = pickOptions(state.seed, secretWord);
      const stage: 0 = 0;
      const drawerId = players[startIndex]?.id ?? players[0]?.id ?? "";
      return {
        phase: "draw",
        round,
        seed: state.seed,
        startIndex,
        stage,
        drawerId,
        stageStartedAt: action.type === "next" ? Date.now() : state.stageStartedAt,
        guessStartedAt: 0,
        secretWord,
        options,
        drawings: [[], [], []],
        guesses: {},
        scores: state.scores,
      };
    }
    default: {
      const _n: never = action;
      return _n;
    }
  }
}

