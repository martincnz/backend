import { mulberry32, shuffle } from "../../lib/random";
import type { Player } from "../../types";

export type TetrominoType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Tetromino = { type: TetrominoType; rotation: 0 | 1 | 2 | 3; x: number; y: number };

export type TetrisPlayerState = {
  id: string;
  board: number[][]; // [row][col], 0 empty, otherwise piece color id
  current: Tetromino | null;
  bagIndex: number;
  bagPos: number;
  lines: number;
  level: number;
  score: number;
  status: "playing" | "gameover";
  lastFallAt: number; // ms epoch, host clock
};

export type TetrisState = {
  phase: "playing" | "match";
  seed: number;
  startedAt: number; // ms epoch
  players: Record<string, TetrisPlayerState>;
};

export type TetrisInput = "left" | "right" | "rotate" | "down" | "drop";

export type TetrisAction =
  | { type: "input"; input: TetrisInput; at: number }
  | { type: "tick"; at: number };

const WIDTH = 10;
const HEIGHT = 20;

const COLORS: Record<TetrominoType, number> = {
  I: 1,
  O: 2,
  T: 3,
  S: 4,
  Z: 5,
  J: 6,
  L: 7,
};

type Matrix4 = number[][];

const BASE_MATRICES: Record<TetrominoType, Matrix4> = {
  // 4x4 matrices: 1 = filled
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  T: [
    [0, 1, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  S: [
    [0, 1, 1, 0],
    [1, 1, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  Z: [
    [1, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  L: [
    [0, 0, 1, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
};

function rotateMatrixCW(m: Matrix4): Matrix4 {
  // (x, y) -> (3 - y, x)
  const out: Matrix4 = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 4; x += 1) {
      out[x][3 - y] = m[y][x];
    }
  }
  return out;
}

function getBlocksFor(t: Tetromino): Array<{ x: number; y: number }> {
  let m = BASE_MATRICES[t.type];
  if (t.rotation === 1) m = rotateMatrixCW(m);
  if (t.rotation === 2) m = rotateMatrixCW(rotateMatrixCW(m));
  if (t.rotation === 3) m = rotateMatrixCW(rotateMatrixCW(rotateMatrixCW(m)));

  const out: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 4; x += 1) {
      if (m[y][x]) out.push({ x: t.x + x, y: t.y + y });
    }
  }
  return out;
}

export function getTetrominoBlocks(t: Tetromino): Array<{ x: number; y: number; color: number }> {
  return getBlocksFor(t).map((b) => ({ ...b, color: COLORS[t.type] ?? 1 }));
}

function emptyBoard(): number[][] {
  return Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => 0));
}

function canPlace(board: number[][], tet: Tetromino): boolean {
  const blocks = getBlocksFor(tet);
  for (const b of blocks) {
    if (b.x < 0 || b.x >= WIDTH) return false;
    if (b.y >= HEIGHT) return false;
    if (b.y >= 0 && board[b.y]?.[b.x] !== 0) return false;
  }
  return true;
}

function merge(board: number[][], tet: Tetromino): number[][] {
  const next = board.map((row) => row.slice());
  const val = COLORS[tet.type] ?? 1;
  for (const b of getBlocksFor(tet)) {
    if (b.y < 0) continue;
    if (b.y >= HEIGHT) continue;
    next[b.y][b.x] = val;
  }
  return next;
}

function clearLines(board: number[][]): { board: number[][]; cleared: number } {
  const fullRows: number[] = [];
  for (let y = 0; y < HEIGHT; y += 1) {
    if (board[y].every((cell) => cell !== 0)) fullRows.push(y);
  }
  if (fullRows.length === 0) return { board, cleared: 0 };

  const remaining = board.filter((_, y) => !fullRows.includes(y));
  const newRows = Array.from({ length: fullRows.length }, () => Array.from({ length: WIDTH }, () => 0));
  return { board: [...newRows, ...remaining], cleared: fullRows.length };
}

function pointsForLines(cleared: number, level: number): number {
  const base = cleared === 1 ? 100 : cleared === 2 ? 300 : cleared === 3 ? 500 : cleared === 4 ? 800 : 0;
  return base * Math.max(1, level);
}

function dropMsFor(level: number): number {
  return Math.max(90, 650 - (level - 1) * 55);
}

const PIECES: TetrominoType[] = ["I", "O", "T", "S", "Z", "J", "L"];

function nextFromBag(seed: number, bagIndex: number, bagPos: number): TetrominoType {
  const rand = mulberry32(seed + bagIndex * 991);
  const bag = shuffle(PIECES, rand);
  return bag[bagPos] ?? bag[0] ?? "I";
}

function spawnNewPlayerPiece(playerSeed: number, bagIndex: number, bagPos: number): {
  current: Tetromino;
  nextBagIndex: number;
  nextBagPos: number;
} {
  const type = nextFromBag(playerSeed, bagIndex, bagPos);
  const current: Tetromino = { type, rotation: 0, x: 3, y: -2 };
  const nextBagPos = bagPos + 1;
  const nextBagIndex = nextBagPos >= 7 ? bagIndex + 1 : bagIndex;
  const wrappedBagPos = nextBagPos >= 7 ? 0 : nextBagPos;
  return { current, nextBagIndex, nextBagPos: wrappedBagPos };
}

function tryMove(player: TetrisPlayerState, deltaX: number, deltaY: number): TetrisPlayerState {
  if (!player.current) return player;
  const next: Tetromino = { ...player.current, x: player.current.x + deltaX, y: player.current.y + deltaY };
  if (!canPlace(player.board, next)) return player;
  return { ...player, current: next };
}

function tryRotate(player: TetrisPlayerState): TetrisPlayerState {
  if (!player.current) return player;
  const rotation = (((player.current.rotation + 1) % 4) as 0 | 1 | 2 | 3);
  const base: Tetromino = { ...player.current, rotation };
  const kicks = [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: -2, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: -1 },
  ];
  for (const k of kicks) {
    const candidate: Tetromino = { ...base, x: base.x + k.x, y: base.y + k.y };
    if (canPlace(player.board, candidate)) return { ...player, current: candidate };
  }
  return player;
}

export function initTetris(seed: number, players: Player[]): TetrisState {
  const startedAt = Date.now();
  const nextPlayers: Record<string, TetrisPlayerState> = {};
  for (let i = 0; i < players.length; i += 1) {
    const p = players[i]!;
    const hash = [...p.id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const playerSeed = seed + hash * 17;
    const board = emptyBoard();
    const { current, nextBagIndex, nextBagPos } = spawnNewPlayerPiece(playerSeed, 0, 0);
    const status: "playing" | "gameover" = canPlace(board, current) ? "playing" : "gameover";
    nextPlayers[p.id] = {
      id: p.id,
      board,
      current: status === "playing" ? current : null,
      bagIndex: nextBagIndex,
      bagPos: nextBagPos,
      lines: 0,
      level: 1,
      score: 0,
      status,
      lastFallAt: startedAt,
    };
  }
  return { phase: "playing", seed, startedAt, players: nextPlayers };
}

function tickPlayer(state: TetrisState, player: TetrisPlayerState, at: number): TetrisPlayerState {
  if (player.status !== "playing" || !player.current) return player;
  const ms = dropMsFor(player.level);
  if (at - player.lastFallAt < ms) return player;

  const down: Tetromino = { ...player.current, y: player.current.y + 1 };
  if (canPlace(player.board, down)) {
    return { ...player, current: down, lastFallAt: at };
  }
  return lockAndSpawn(state, player, at);
}

function lockAndSpawn(state: TetrisState, player: TetrisPlayerState, at: number): TetrisPlayerState {
  if (player.status !== "playing" || !player.current) return player;
  const merged = merge(player.board, player.current);
  const cleared = clearLines(merged);
  const lines = player.lines + cleared.cleared;
  const level = 1 + Math.floor(lines / 10);
  const score = player.score + pointsForLines(cleared.cleared, level);

  // spawn (deterministic from id + global seed)
  const hash = [...player.id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const playerSeed = state.seed + hash * 17;
  const spawn = spawnNewPlayerPiece(playerSeed, player.bagIndex, player.bagPos);

  const nextStatus: "playing" | "gameover" = canPlace(cleared.board, spawn.current) ? "playing" : "gameover";
  return {
    ...player,
    board: cleared.board,
    lines,
    level,
    score,
    current: nextStatus === "playing" ? spawn.current : null,
    bagIndex: spawn.nextBagIndex,
    bagPos: spawn.nextBagPos,
    status: nextStatus,
    lastFallAt: at,
  };
}

function tryHardDrop(state: TetrisState, player: TetrisPlayerState, at: number): TetrisPlayerState {
  if (player.status !== "playing" || !player.current) return player;
  let p: TetrisPlayerState = player;
  while (p.current) {
    const down: Tetromino = { ...p.current, y: p.current.y + 1 };
    if (!canPlace(p.board, down)) break;
    p = { ...p, current: down };
  }
  return lockAndSpawn(state, p, at);
}

function trySoftDown(state: TetrisState, player: TetrisPlayerState, at: number): TetrisPlayerState {
  if (player.status !== "playing" || !player.current) return player;
  const down: Tetromino = { ...player.current, y: player.current.y + 1 };
  if (canPlace(player.board, down)) return { ...player, current: down, lastFallAt: at };
  return lockAndSpawn(state, player, at);
}

export function reduceTetris(
  state: TetrisState,
  action: TetrisAction,
  from: string,
  players: Player[],
): TetrisState {
  if (state.phase !== "playing") return state;

  if (action.type === "input") {
    const player = state.players[from];
    if (!player) return state;
    const at = action.at;
    let updated = player;
    switch (action.input) {
      case "left":
        updated = tryMove(player, -1, 0);
        break;
      case "right":
        updated = tryMove(player, 1, 0);
        break;
      case "rotate":
        updated = tryRotate(player);
        break;
      case "down":
        updated = trySoftDown(state, player, at);
        break;
      case "drop":
        updated = tryHardDrop(state, player, at);
        break;
      default: {
        const _ex: never = action.input;
        void _ex;
      }
    }

    return {
      ...state,
      players: { ...state.players, [from]: updated },
    };
  }

  // tick
  const at = action.at;
  let changed = false;
  const nextPlayers: Record<string, TetrisPlayerState> = { ...state.players };
  for (const p of players) {
    const cur = nextPlayers[p.id];
    if (!cur) continue;
    const next = tickPlayer(state, cur, at);
    if (next !== cur) changed = true;
    nextPlayers[p.id] = next;
  }

  if (!changed) return state;

  const allOver = players.every((p) => nextPlayers[p.id]?.status === "gameover");
  return { ...state, players: nextPlayers, phase: allOver ? "match" : state.phase };
}

export const TETRIS_WIDTH = WIDTH;
export const TETRIS_HEIGHT = HEIGHT;
export function getDropMs(level: number): number {
  return dropMsFor(level);
}

