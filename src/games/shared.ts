import type { Player } from "../types";

export const ROUNDS = 3;
export const PLAY_MS = 8000;
export const FALSE_START = 99_999;
export const TAP_TIMEOUT = 5_000;

export type GameOpts = { solo?: boolean };

export function blankScores(players: Player[]): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const player of players) scores[player.id] = 0;
  return scores;
}

export function nextPlayerId(players: Player[], currentId: string): string {
  const idx = players.findIndex((player) => player.id === currentId);
  const next = players[(idx + 1) % Math.max(players.length, 1)];
  return next?.id ?? currentId;
}

export function allHave<T>(
  values: Record<string, T | undefined>,
  players: Player[],
): boolean {
  return players.every((player) => values[player.id] !== undefined);
}

/** Lowest finite value wins the round. False starts (huge numbers) never win. */
export function awardLow(
  scores: Record<string, number>,
  values: Record<string, number | undefined>,
  players: Player[],
): Record<string, number> {
  let best = Infinity;
  for (const player of players) {
    const value = values[player.id];
    if (value === undefined) continue;
    if (value < best) best = value;
  }
  if (!Number.isFinite(best) || best >= FALSE_START) return scores;
  const next = { ...scores };
  for (const player of players) {
    if (values[player.id] === best) next[player.id] = (next[player.id] ?? 0) + 1;
  }
  return next;
}

/** Highest value wins the round. Ties share the point. */
export function awardHigh(
  scores: Record<string, number>,
  values: Record<string, number | undefined>,
  players: Player[],
): Record<string, number> {
  let best = -Infinity;
  for (const player of players) {
    const value = values[player.id];
    if (value === undefined) continue;
    if (value > best) best = value;
  }
  if (!Number.isFinite(best)) return scores;
  const next = { ...scores };
  for (const player of players) {
    if (values[player.id] === best) next[player.id] = (next[player.id] ?? 0) + 1;
  }
  return next;
}
