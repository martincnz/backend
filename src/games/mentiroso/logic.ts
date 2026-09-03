import { mulberry32, shuffle } from "../../lib/random";
import type { Player } from "../../types";

export const SUITS = ["♠", "♥", "♦", "♣"] as const;
export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
export type Rank = (typeof RANKS)[number];
export type Suit = (typeof SUITS)[number];
export type Card = { rank: Rank; suit: Suit; id: string };

export type MentirosoState = {
  phase: "play" | "call" | "over";
  hands: Record<string, Card[]>;
  pile: Card[];
  lastPlay: { from: string; count: number; rank: Rank } | null;
  currentId: string;
  callerId: string | null;
  lastReveal: Card[] | null;
  lastTruth: boolean | null;
  winnerId: string | null;
};

export type MentirosoAction =
  | { type: "play"; cardIds: string[]; rank: Rank }
  | { type: "trust" }
  | { type: "lie" };

function deck(seed: number): Card[] {
  const cards: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({ rank, suit, id: `${rank}${suit}` });
    }
  }
  return shuffle(cards, mulberry32(seed));
}

export function initMentiroso(seed: number, players: Player[]): MentirosoState {
  const cards = deck(seed);
  const hands: Record<string, Card[]> = {};
  for (const p of players) hands[p.id] = [];
  cards.forEach((card, i) => {
    const p = players[i % players.length];
    if (p) hands[p.id] = [...(hands[p.id] ?? []), card];
  });
  return {
    phase: "play",
    hands,
    pile: [],
    lastPlay: null,
    currentId: players[0]?.id ?? "",
    callerId: null,
    lastReveal: null,
    lastTruth: null,
    winnerId: null,
  };
}

function nextPlayer(players: Player[], from: string): string {
  const idx = players.findIndex((p) => p.id === from);
  const p = players[(idx + 1) % players.length];
  return p?.id ?? from;
}

export function reduceMentiroso(
  state: MentirosoState,
  action: MentirosoAction,
  from: string,
  players: Player[],
): MentirosoState {
  switch (action.type) {
    case "play": {
      if (state.phase !== "play" || from !== state.currentId) return state;
      if (action.cardIds.length < 1 || action.cardIds.length > 3) return state;
      const hand = state.hands[from] ?? [];
      const selected = hand.filter((c) => action.cardIds.includes(c.id));
      if (selected.length !== action.cardIds.length) return state;
      const nextHand = hand.filter((c) => !action.cardIds.includes(c.id));
      const hands = { ...state.hands, [from]: nextHand };
      return {
        ...state,
        hands,
        pile: [...state.pile, ...selected],
        lastPlay: { from, count: selected.length, rank: action.rank },
        phase: "call",
        callerId: nextPlayer(players, from),
        lastReveal: null,
        lastTruth: null,
      };
    }
    case "trust": {
      if (state.phase !== "call" || from !== state.callerId || !state.lastPlay) {
        return state;
      }
      const playedOut = (state.hands[state.lastPlay.from] ?? []).length === 0;
      if (playedOut) {
        return {
          ...state,
          phase: "over",
          winnerId: state.lastPlay.from,
          callerId: null,
        };
      }
      return {
        ...state,
        phase: "play",
        currentId: from,
        callerId: null,
      };
    }
    case "lie": {
      if (state.phase !== "call" || from !== state.callerId || !state.lastPlay) {
        return state;
      }
      const played = state.pile.slice(-state.lastPlay.count);
      const truth = played.every((c) => c.rank === state.lastPlay?.rank);
      if (truth && (state.hands[state.lastPlay.from] ?? []).length === 0) {
        return {
          ...state,
          phase: "over",
          winnerId: state.lastPlay.from,
          lastReveal: played,
          lastTruth: true,
          callerId: null,
          pile: [],
        };
      }
      const taker = truth ? from : state.lastPlay.from;
      const hands = {
        ...state.hands,
        [taker]: [...(state.hands[taker] ?? []), ...state.pile],
      };
      return {
        ...state,
        hands,
        pile: [],
        phase: "play",
        currentId: taker,
        callerId: null,
        lastPlay: null,
        lastReveal: played,
        lastTruth: truth,
      };
    }
    default: {
      const _n: never = action;
      return _n;
    }
  }
}
