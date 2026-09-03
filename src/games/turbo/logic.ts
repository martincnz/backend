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

export type TurboState = {
  phase: "arm" | "race" | "result" | "match";
  solo: boolean;
  round: number;
  currentId: string;
  startAt: number;
  endAt: number;
  taps: Record<string, number>;
  lastId: string | null;
  scores: Record<string, number>;
};

export type TurboAction =
  | { type: "start"; at: number }
  | { type: "tap" }
  | { type: "timeout" }
  | { type: "next" };

export function initTurbo(_seed: number, players: Player[], solo = false): TurboState {
  return {
    phase: "arm",
    solo,
    round: 1,
    currentId: players[0]?.id ?? "",
    startAt: 0,
    endAt: 0,
    taps: {},
    lastId: null,
    scores: blankScores(players),
  };
}

function isActing(state: TurboState, from: string): boolean {
  return state.solo ? from === state.currentId : true;
}

function closeRace(state: TurboState, players: Player[]): TurboState {
  if (state.solo && !allHave(state.taps, players)) {
    return { ...state, phase: "result" };
  }
  if (!allHave(state.taps, players)) return state;
  const scores = awardHigh(state.scores, state.taps, players);
  return {
    ...state,
    phase: state.round >= ROUNDS ? "match" : "result",
    scores,
  };
}

export function reduceTurbo(
  state: TurboState,
  action: TurboAction,
  from: string,
  players: Player[],
): TurboState {
  switch (action.type) {
    case "start": {
      if (state.phase !== "arm" || !isActing(state, from)) return state;
      return {
        ...state,
        phase: "race",
        startAt: action.at,
        endAt: action.at + PLAY_MS,
        taps: state.solo ? { ...state.taps, [from]: 0 } : blankScores(players),
      };
    }
    case "tap": {
      if (state.phase !== "race" || !isActing(state, from)) return state;
      return {
        ...state,
        taps: { ...state.taps, [from]: (state.taps[from] ?? 0) + 1 },
        lastId: from,
      };
    }
    case "timeout": {
      if (state.phase !== "race") return state;
      const taps = { ...state.taps };
      const targets = state.solo ? [state.currentId] : players.map((player) => player.id);
      for (const id of targets) {
        if (taps[id] === undefined) taps[id] = 0;
      }
      return closeRace({ ...state, taps, lastId: state.currentId }, players);
    }
    case "next": {
      if (state.phase !== "result") return state;
      if (state.solo && !allHave(state.taps, players)) {
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
        taps: {},
        lastId: null,
        startAt: 0,
        endAt: 0,
      };
    }
    default:
      return assertNever(action);
  }
}
