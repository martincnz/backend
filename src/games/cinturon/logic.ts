import { mulberry32 } from "../../lib/random";
import type { Player } from "../../types";
import { assertNever } from "../../types";
import {
  FALSE_START,
  ROUNDS,
  TAP_TIMEOUT,
  allHave,
  awardLow,
  blankScores,
  nextPlayerId,
} from "../shared";

export type CinturonState = {
  phase: "arm" | "wait" | "go" | "result" | "match";
  solo: boolean;
  seed: number;
  round: number;
  currentId: string;
  ready: Record<string, boolean>;
  waitMs: number;
  waitStartedAt: number;
  goAt: number;
  times: Record<string, number>;
  lastId: string | null;
  scores: Record<string, number>;
};

export type CinturonAction =
  | { type: "ready" }
  | { type: "go"; at: number }
  | { type: "tap"; at: number }
  | { type: "timeout" }
  | { type: "next" };

function delayFor(seed: number, round: number, currentId: string): number {
  const rand = mulberry32(seed + round * 97 + currentId.length * 13);
  return 800 + Math.floor(rand() * 1700);
}

export function initCinturon(seed: number, players: Player[], solo = false): CinturonState {
  const currentId = players[0]?.id ?? "";
  return {
    phase: "arm",
    solo,
    seed,
    round: 1,
    currentId,
    ready: {},
    waitMs: delayFor(seed, 1, currentId),
    waitStartedAt: 0,
    goAt: 0,
    times: {},
    lastId: null,
    scores: blankScores(players),
  };
}

function isActing(state: CinturonState, from: string): boolean {
  return state.solo ? from === state.currentId : true;
}

function closeAttempt(state: CinturonState, players: Player[]): CinturonState {
  if (!allHave(state.times, players)) {
    if (state.solo) return { ...state, phase: "result" };
    return state;
  }
  const scores = awardLow(state.scores, state.times, players);
  return {
    ...state,
    phase: state.round >= ROUNDS ? "match" : "result",
    scores,
  };
}

export function reduceCinturon(
  state: CinturonState,
  action: CinturonAction,
  from: string,
  players: Player[],
): CinturonState {
  switch (action.type) {
    case "ready": {
      if (state.phase !== "arm" || !isActing(state, from)) return state;
      const ready = { ...state.ready, [from]: true };
      const needed = state.solo
        ? ready[state.currentId]
        : players.every((player) => ready[player.id]);
      if (!needed) return { ...state, ready };
      return {
        ...state,
        ready,
        phase: "wait",
        waitMs: delayFor(state.seed, state.round, state.currentId),
        waitStartedAt: Date.now(),
      };
    }
    case "go": {
      if (state.phase !== "wait") return state;
      return { ...state, phase: "go", goAt: action.at };
    }
    case "tap": {
      if (!isActing(state, from)) return state;
      if (state.times[from] !== undefined) return state;
      if (state.phase === "wait") {
        return closeAttempt(
          { ...state, times: { ...state.times, [from]: FALSE_START }, lastId: from },
          players,
        );
      }
      if (state.phase !== "go") return state;
      const reaction = Math.max(0, action.at - state.goAt);
      return closeAttempt(
        { ...state, times: { ...state.times, [from]: reaction }, lastId: from },
        players,
      );
    }
    case "timeout": {
      if (state.phase !== "go") return state;
      const times = { ...state.times };
      const targets = state.solo ? [state.currentId] : players.map((player) => player.id);
      for (const id of targets) {
        if (times[id] === undefined) times[id] = TAP_TIMEOUT;
      }
      return closeAttempt({ ...state, times, lastId: state.currentId }, players);
    }
    case "next": {
      if (state.phase !== "result") return state;
      if (state.solo && !allHave(state.times, players)) {
        const currentId = nextPlayerId(players, state.currentId);
        return {
          ...state,
          phase: "arm",
          currentId,
          ready: {},
          lastId: null,
          waitMs: delayFor(state.seed, state.round, currentId),
        };
      }
      if (state.round >= ROUNDS) {
        return { ...state, phase: "match" };
      }
      const currentId = players[0]?.id ?? state.currentId;
      return {
        ...state,
        phase: "arm",
        round: state.round + 1,
        currentId,
        ready: {},
        times: {},
        lastId: null,
        goAt: 0,
        waitMs: delayFor(state.seed, state.round + 1, currentId),
      };
    }
    default:
      return assertNever(action);
  }
}
