import { mulberry32, shuffle } from "../../lib/random";
import { QUESTIONS } from "./data";
import type { Player } from "../../types";

export type TrivialState = {
  phase: "ask" | "reveal" | "done";
  index: number;
  order: number[];
  answers: Record<string, number>;
  scores: Record<string, number>;
  locked: Record<string, boolean>;
};

export type TrivialAction =
  | { type: "answer"; choice: number }
  | { type: "next" };

const ROUND_COUNT = 8;

export function initTrivial(seed: number, players: Player[]): TrivialState {
  const rand = mulberry32(seed);
  const order = shuffle(
    QUESTIONS.map((_, i) => i),
    rand,
  ).slice(0, ROUND_COUNT);
  const scores: Record<string, number> = {};
  const answers: Record<string, number> = {};
  const locked: Record<string, boolean> = {};
  for (const p of players) {
    scores[p.id] = 0;
    answers[p.id] = -1;
    locked[p.id] = false;
  }
  return { phase: "ask", index: 0, order, answers, scores, locked };
}

export function reduceTrivial(
  state: TrivialState,
  action: TrivialAction,
  from: string,
  players: Player[],
): TrivialState {
  const qIndex = state.order[state.index] ?? 0;
  const question = QUESTIONS[qIndex];
  if (!question) return state;
  switch (action.type) {
    case "answer": {
      if (state.phase !== "ask" || state.locked[from]) return state;
      const answers = { ...state.answers, [from]: action.choice };
      const locked = { ...state.locked, [from]: true };
      const allIn = players.every((p) => locked[p.id]);
      if (!allIn) return { ...state, answers, locked };
      const scores = { ...state.scores };
      for (const p of players) {
        if (answers[p.id] === question.ok) scores[p.id] = (scores[p.id] ?? 0) + 1;
      }
      return { ...state, answers, locked, scores, phase: "reveal" };
    }
    case "next": {
      if (state.phase !== "reveal") return state;
      const next = state.index + 1;
      if (next >= state.order.length) {
        return { ...state, phase: "done", index: next };
      }
      const answers: Record<string, number> = {};
      const locked: Record<string, boolean> = {};
      for (const p of players) {
        answers[p.id] = -1;
        locked[p.id] = false;
      }
      return { ...state, phase: "ask", index: next, answers, locked };
    }
    default: {
      const _n: never = action;
      return _n;
    }
  }
}
