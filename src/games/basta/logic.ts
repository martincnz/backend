import { fold, mulberry32 } from "../../lib/random";
import type { Player } from "../../types";

export const BASTA_CATS = [
  "nombre",
  "apellido",
  "ciudad",
  "animal",
  "color",
  "cosa",
] as const;

export type BastaCat = (typeof BASTA_CATS)[number];
export type BastaAnswers = Record<BastaCat, string>;

export type BastaState = {
  phase: "ready" | "write" | "reveal" | "match";
  seed: number;
  round: number;
  letter: string;
  durationMs: number;
  answers: Record<string, BastaAnswers>;
  submitted: Record<string, boolean>;
  scores: Record<string, number>;
  roundPoints: Record<string, number>;
  target: number;
};

export type BastaAction =
  | { type: "begin" }
  | { type: "submit"; answers: BastaAnswers }
  | { type: "basta"; answers: BastaAnswers }
  | { type: "next" };

const LETTERS = "ABCDEFGHIJLMNOPRSTUVY".split("");

export const EMPTY_ANSWERS: BastaAnswers = {
  nombre: "",
  apellido: "",
  ciudad: "",
  animal: "",
  color: "",
  cosa: "",
};

function emptyAnswers(): BastaAnswers {
  return { ...EMPTY_ANSWERS };
}

export function initBasta(seed: number, players: Player[]): BastaState {
  const scores: Record<string, number> = {};
  for (const p of players) scores[p.id] = 0;
  return {
    phase: "ready",
    seed,
    round: 0,
    letter: pickLetter(seed, 0),
    durationMs: 40000,
    answers: {},
    submitted: {},
    scores,
    roundPoints: {},
    target: 50,
  };
}

function pickLetter(seed: number, round: number): string {
  const rand = mulberry32(seed + round * 97);
  const letter = LETTERS[Math.floor(rand() * LETTERS.length)];
  return letter ?? "A";
}

function validWord(word: string, letter: string): string | null {
  const f = fold(word);
  if (f.length < 2) return null;
  if (!f.startsWith(fold(letter))) return null;
  return f;
}

export function scoreBastaRound(
  answers: Record<string, BastaAnswers>,
  letter: string,
  playerIds: string[],
): Record<string, number> {
  const points: Record<string, number> = {};
  for (const id of playerIds) points[id] = 0;
  for (const cat of BASTA_CATS) {
    const words: Record<string, string> = {};
    const counts: Record<string, number> = {};
    for (const id of playerIds) {
      const raw = answers[id]?.[cat] ?? "";
      const word = validWord(raw, letter);
      if (!word) continue;
      words[id] = word;
      counts[word] = (counts[word] ?? 0) + 1;
    }
    for (const id of playerIds) {
      const word = words[id];
      if (!word) continue;
      points[id] = (points[id] ?? 0) + ((counts[word] ?? 0) > 1 ? 5 : 10);
    }
  }
  return points;
}

export function reduceBasta(
  state: BastaState,
  action: BastaAction,
  from: string,
  players: Player[],
): BastaState {
  const ids = players.map((p) => p.id);
  switch (action.type) {
    case "begin": {
      if (state.phase !== "ready" && state.phase !== "match") return state;
      const answers: Record<string, BastaAnswers> = {};
      const submitted: Record<string, boolean> = {};
      for (const id of ids) {
        answers[id] = emptyAnswers();
        submitted[id] = false;
      }
      return {
        ...state,
        phase: "write",
        round: state.round + 1,
        letter: pickLetter(state.seed, state.round + 1),
        answers,
        submitted,
        roundPoints: {},
      };
    }
    case "submit":
    case "basta": {
      if (state.phase !== "write") return state;
      const answers = {
        ...state.answers,
        [from]: { ...emptyAnswers(), ...action.answers },
      };
      const submitted = { ...state.submitted, [from]: true };
      const allIn =
        action.type === "basta" || ids.every((id) => submitted[id]);
      if (!allIn) {
        return { ...state, answers, submitted };
      }
      const roundPoints = scoreBastaRound(answers, state.letter, ids);
      const scores = { ...state.scores };
      for (const id of ids) {
        scores[id] = (scores[id] ?? 0) + (roundPoints[id] ?? 0);
      }
      const leader = Math.max(0, ...Object.values(scores));
      return {
        ...state,
        answers,
        submitted,
        roundPoints,
        scores,
        phase: leader >= state.target ? "match" : "reveal",
      };
    }
    case "next": {
      if (state.phase !== "reveal") return state;
      return { ...state, phase: "ready" };
    }
    default: {
      const _n: never = action;
      return _n;
    }
  }
}

export const BASTA_LABELS: Record<BastaCat, string> = {
  nombre: "Nombre",
  apellido: "Apellido",
  ciudad: "Ciudad / país",
  animal: "Animal",
  color: "Color",
  cosa: "Cosa",
};
