import { mulberry32 } from "../../lib/random";
import type { Player } from "../../types";
import { assertNever } from "../../types";
import { awardHigh, blankScores, nextPlayerId } from "../shared";

export const ECO_MAX = 8;
export const ECO_PADS = 4;

export type EcoProgress = {
  level: number;
  input: number;
  score: number;
  dead: boolean;
};

export type EcoState = {
  phase: "play" | "result" | "match";
  solo: boolean;
  currentId: string;
  sequence: number[];
  progress: Record<string, EcoProgress>;
  scores: Record<string, number>;
};

export type EcoAction = { type: "press"; pad: number } | { type: "next" };

function makeSequence(seed: number, length: number): number[] {
  const rand = mulberry32(seed);
  return Array.from({ length }, () => Math.floor(rand() * ECO_PADS));
}

function blankProgress(players: Player[]): Record<string, EcoProgress> {
  const progress: Record<string, EcoProgress> = {};
  for (const player of players) {
    progress[player.id] = { level: 1, input: 0, score: 0, dead: false };
  }
  return progress;
}

export function initEco(seed: number, players: Player[], solo = false): EcoState {
  return {
    phase: "play",
    solo,
    currentId: players[0]?.id ?? "",
    sequence: makeSequence(seed, ECO_MAX),
    progress: blankProgress(players),
    scores: blankScores(players),
  };
}

function everyoneDone(state: EcoState, players: Player[]): boolean {
  return players.every((player) => state.progress[player.id]?.dead);
}

function finishIfReady(state: EcoState, players: Player[]): EcoState {
  if (!everyoneDone(state, players)) return state;
  const values: Record<string, number> = {};
  for (const player of players) values[player.id] = state.progress[player.id]?.score ?? 0;
  return {
    ...state,
    phase: "match",
    scores: awardHigh(state.scores, values, players),
  };
}

export function reduceEco(
  state: EcoState,
  action: EcoAction,
  from: string,
  players: Player[],
): EcoState {
  switch (action.type) {
    case "press": {
      if (state.phase !== "play") return state;
      if (state.solo && from !== state.currentId) return state;
      if (action.pad < 0 || action.pad >= ECO_PADS) return state;
      const prev = state.progress[from];
      if (!prev || prev.dead) return state;
      const expected = state.sequence[prev.input];
      if (expected === undefined || action.pad !== expected) {
        const progress = {
          ...state.progress,
          [from]: { ...prev, dead: true },
        };
        const next: EcoState = { ...state, progress };
        if (state.solo) return { ...next, phase: "result" };
        return finishIfReady(next, players);
      }
      let level = prev.level;
      let input = prev.input + 1;
      let score = prev.score;
      let dead = false;
      if (input >= level) {
        score = level;
        if (level >= ECO_MAX) {
          dead = true;
        } else {
          level += 1;
          input = 0;
        }
      }
      const progress = {
        ...state.progress,
        [from]: { level, input, score, dead },
      };
      const next: EcoState = { ...state, progress };
      if (dead && state.solo) return { ...next, phase: "result" };
      if (dead) return finishIfReady(next, players);
      return next;
    }
    case "next": {
      if (state.phase !== "result") return state;
      if (!state.solo) return finishIfReady(state, players);
      if (!everyoneDone(state, players)) {
        return {
          ...state,
          phase: "play",
          currentId: nextPlayerId(players, state.currentId),
        };
      }
      return finishIfReady({ ...state, phase: "play" }, players);
    }
    default:
      return assertNever(action);
  }
}
