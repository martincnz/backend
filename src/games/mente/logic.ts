import { mulberry32, shuffle } from "../../lib/random";
import type { Player } from "../../types";

export type MenteState = {
  phase: "play" | "level" | "won" | "lost";
  level: number;
  lives: number;
  hands: Record<string, number[]>;
  played: Array<{ from: string; value: number }>;
  maxLevel: number;
};

export type MenteAction = { type: "play" } | { type: "continue" };

export function initMente(seed: number, players: Player[]): MenteState {
  return dealLevel(1, seed, players, 3);
}

function dealLevel(
  level: number,
  seed: number,
  players: Player[],
  lives: number,
): MenteState {
  const rand = mulberry32(seed + level * 1009);
  const deck = shuffle(
    Array.from({ length: 100 }, (_, i) => i + 1),
    rand,
  );
  const hands: Record<string, number[]> = {};
  let i = 0;
  for (const p of players) {
    const cards = deck.slice(i, i + level).sort((a, b) => a - b);
    hands[p.id] = cards;
    i += level;
  }
  return {
    phase: "play",
    level,
    lives,
    hands,
    played: [],
    maxLevel: Math.min(5, Math.max(3, players.length + 2)),
  };
}

export function lowestRemaining(hands: Record<string, number[]>): number | null {
  let min: number | null = null;
  for (const cards of Object.values(hands)) {
    for (const n of cards) {
      if (min === null || n < min) min = n;
    }
  }
  return min;
}

export function reduceMente(
  state: MenteState,
  action: MenteAction,
  from: string,
  players: Player[],
): MenteState {
  switch (action.type) {
    case "play": {
      if (state.phase !== "play") return state;
      const hand = state.hands[from] ?? [];
      const value = hand[0];
      if (value === undefined) return state;
      const expected = lowestRemaining(state.hands);
      const nextHand = hand.slice(1);
      const hands = { ...state.hands, [from]: nextHand };
      const played = [...state.played, { from, value }];
      if (expected !== null && value !== expected) {
        const burned: Record<string, number[]> = {};
        for (const [id, cards] of Object.entries(hands)) {
          burned[id] = cards.filter((n) => n > value);
        }
        const lives = state.lives - 1;
        if (lives <= 0) {
          return { ...state, hands: burned, played, lives, phase: "lost" };
        }
        const remaining = Object.values(burned).some((c) => c.length > 0);
        return {
          ...state,
          hands: burned,
          played,
          lives,
          phase: remaining ? "play" : "level",
        };
      }
      const remaining = Object.values(hands).some((c) => c.length > 0);
      if (remaining) return { ...state, hands, played };
      if (state.level >= state.maxLevel) {
        return { ...state, hands, played, phase: "won" };
      }
      return { ...state, hands, played, phase: "level" };
    }
    case "continue": {
      if (state.phase !== "level") return state;
      return dealLevel(state.level + 1, state.played.length + 7, players, state.lives);
    }
    default: {
      const _n: never = action;
      return _n;
    }
  }
}
