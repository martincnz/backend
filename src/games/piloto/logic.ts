import type { Player } from "../../types";
import { assertNever } from "../../types";
import {
  PLAY_MS,
  ROUNDS,
  allHave,
  awardHigh,
  blankScores,
  nextPlayerId,
} from "../shared";

export const GREEN_DEG = 14;

export type PilotoState = {
  phase: "arm" | "fly" | "result" | "match";
  solo: boolean;
  round: number;
  currentId: string;
  startAt: number;
  endAt: number;
  greenMs: Record<string, number>;
  done: Record<string, boolean>;
  lastId: string | null;
  scores: Record<string, number>;
};

export type PilotoAction =
  | { type: "start"; at: number }
  | { type: "tick"; greenMs: number }
  | { type: "done"; greenMs: number }
  | { type: "timeout" }
  | { type: "next" };

export function initPiloto(_seed: number, players: Player[], solo = false): PilotoState {
  return {
    phase: "arm",
    solo,
    round: 1,
    currentId: players[0]?.id ?? "",
    startAt: 0,
    endAt: 0,
    greenMs: {},
    done: {},
    lastId: null,
    scores: blankScores(players),
  };
}

function isActing(state: PilotoState, from: string): boolean {
  return state.solo ? from === state.currentId : true;
}

function closeFly(state: PilotoState, players: Player[]): PilotoState {
  if (state.solo && !allHave(state.greenMs, players)) {
    return { ...state, phase: "result" };
  }
  if (!allHave(state.greenMs, players)) return state;
  const scores = awardHigh(state.scores, state.greenMs, players);
  return {
    ...state,
    phase: state.round >= ROUNDS ? "match" : "result",
    scores,
  };
}

export function reducePiloto(
  state: PilotoState,
  action: PilotoAction,
  from: string,
  players: Player[],
): PilotoState {
  switch (action.type) {
    case "start": {
      if (state.phase !== "arm" || !isActing(state, from)) return state;
      return {
        ...state,
        phase: "fly",
        startAt: action.at,
        endAt: action.at + PLAY_MS,
        greenMs: state.solo ? { ...state.greenMs } : {},
        done: {},
      };
    }
    case "tick": {
      if (state.phase !== "fly" || !isActing(state, from)) return state;
      const greenMs = Math.max(state.greenMs[from] ?? 0, action.greenMs);
      return { ...state, greenMs: { ...state.greenMs, [from]: greenMs } };
    }
    case "done": {
      if (state.phase !== "fly" || !isActing(state, from)) return state;
      const greenMs = {
        ...state.greenMs,
        [from]: Math.max(state.greenMs[from] ?? 0, action.greenMs),
      };
      const done = { ...state.done, [from]: true };
      const next = { ...state, greenMs, done, lastId: from };
      const finished = state.solo ? true : players.every((player) => done[player.id]);
      return finished ? closeFly(next, players) : next;
    }
    case "timeout": {
      if (state.phase !== "fly") return state;
      const greenMs = { ...state.greenMs };
      const targets = state.solo ? [state.currentId] : players.map((player) => player.id);
      for (const id of targets) {
        if (greenMs[id] === undefined) greenMs[id] = 0;
      }
      return closeFly({ ...state, greenMs, lastId: state.currentId }, players);
    }
    case "next": {
      if (state.phase !== "result") return state;
      if (state.solo && !allHave(state.greenMs, players)) {
        return {
          ...state,
          phase: "arm",
          currentId: nextPlayerId(players, state.currentId),
          lastId: null,
        };
      }
      if (state.round >= ROUNDS) return { ...state, phase: "match" };
      return {
        ...state,
        phase: "arm",
        round: state.round + 1,
        currentId: players[0]?.id ?? state.currentId,
        greenMs: {},
        done: {},
        lastId: null,
        startAt: 0,
        endAt: 0,
      };
    }
    default:
      return assertNever(action);
  }
}
