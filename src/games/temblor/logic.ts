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

export type TemblorState = {
  phase: "arm" | "shake" | "result" | "match";
  solo: boolean;
  round: number;
  currentId: string;
  startAt: number;
  endAt: number;
  energy: Record<string, number>;
  done: Record<string, boolean>;
  lastId: string | null;
  scores: Record<string, number>;
};

export type TemblorAction =
  | { type: "start"; at: number }
  | { type: "tick"; energy: number }
  | { type: "done"; energy: number }
  | { type: "timeout" }
  | { type: "next" };

export function initTemblor(_seed: number, players: Player[], solo = false): TemblorState {
  return {
    phase: "arm",
    solo,
    round: 1,
    currentId: players[0]?.id ?? "",
    startAt: 0,
    endAt: 0,
    energy: {},
    done: {},
    lastId: null,
    scores: blankScores(players),
  };
}

function isActing(state: TemblorState, from: string): boolean {
  return state.solo ? from === state.currentId : true;
}

function closeShake(state: TemblorState, players: Player[]): TemblorState {
  if (state.solo && !allHave(state.energy, players)) {
    return { ...state, phase: "result" };
  }
  if (!allHave(state.energy, players)) return state;
  const scores = awardHigh(state.scores, state.energy, players);
  return {
    ...state,
    phase: state.round >= ROUNDS ? "match" : "result",
    scores,
  };
}

export function reduceTemblor(
  state: TemblorState,
  action: TemblorAction,
  from: string,
  players: Player[],
): TemblorState {
  switch (action.type) {
    case "start": {
      if (state.phase !== "arm" || !isActing(state, from)) return state;
      return {
        ...state,
        phase: "shake",
        startAt: action.at,
        endAt: action.at + PLAY_MS,
        energy: state.solo ? { ...state.energy } : {},
        done: {},
      };
    }
    case "tick": {
      if (state.phase !== "shake" || !isActing(state, from)) return state;
      const energy = Math.max(state.energy[from] ?? 0, action.energy);
      return { ...state, energy: { ...state.energy, [from]: energy } };
    }
    case "done": {
      if (state.phase !== "shake" || !isActing(state, from)) return state;
      const energy = {
        ...state.energy,
        [from]: Math.max(state.energy[from] ?? 0, action.energy),
      };
      const done = { ...state.done, [from]: true };
      const next = { ...state, energy, done, lastId: from };
      const finished = state.solo
        ? true
        : players.every((player) => done[player.id]);
      return finished ? closeShake(next, players) : next;
    }
    case "timeout": {
      if (state.phase !== "shake") return state;
      const energy = { ...state.energy };
      const targets = state.solo ? [state.currentId] : players.map((player) => player.id);
      for (const id of targets) {
        if (energy[id] === undefined) energy[id] = 0;
      }
      return closeShake({ ...state, energy, lastId: state.currentId }, players);
    }
    case "next": {
      if (state.phase !== "result") return state;
      if (state.solo && !allHave(state.energy, players)) {
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
        energy: {},
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
