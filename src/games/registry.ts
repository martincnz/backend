import type { GameId, Player } from "../types";
import { assertNever } from "../types";
import { initTetris, reduceTetris, type TetrisAction, type TetrisState } from "./tetris/logic";
import type { GameOpts } from "./shared";

export type AnyGameState = TetrisState;

export const GAMES: Array<{
  id: GameId;
  title: string;
  blurb: string;
  tag: string;
}> = [
  {
    id: "tetris",
    title: "Tetris",
    blurb: "1 a 3 celulares. El host controla el tiempo; cada teléfono juega su tablero.",
    tag: "arcade",
  },
];

export function gameTitle(id: GameId): string {
  switch (id) {
    case "tetris":
      return "Tetris";
    default:
      return assertNever(id);
  }
}

export function initGame(
  id: GameId,
  seed: number,
  players: Player[],
  _opts: GameOpts = {},
): unknown {
  switch (id) {
    case "tetris":
      return initTetris(seed, players);
    default:
      return assertNever(id);
  }
}

export function reduceGame(
  id: GameId,
  state: unknown,
  action: unknown,
  from: string,
  players: Player[],
): unknown {
  if (!state || typeof action !== "object" || action === null || !("type" in action)) {
    return state;
  }
  switch (id) {
    case "tetris":
      return reduceTetris(state as TetrisState, action as TetrisAction, from, players);
    default:
      return assertNever(id);
  }
}

export function turnPlayerId(_id: GameId, _state: unknown): string | null {
  // No hay información secreta.
  return null;
}

export function needsPassCover(_id: GameId): boolean {
  return false;
}

