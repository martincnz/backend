import { useEffect, useMemo, useRef } from "react";
import type { RoomSnapshot, GameRoom } from "../../net/room";
import { Button, ScoreChips } from "../../ui/kit";
import type { TetrisAction, TetrisInput, TetrisState } from "./logic";
import {
  getDropMs,
  getTetrominoBlocks,
  TETRIS_HEIGHT,
  TETRIS_WIDTH,
} from "./logic";

const CELL = 16;
const COLOR_BY_ID: Record<number, string> = {
  0: "transparent",
  1: "#39d7ff",
  2: "#ffd166",
  3: "#b388ff",
  4: "#7dffc2",
  5: "#ff7a6e",
  6: "#8fb7ff",
  7: "#ff9f1c",
};

export function TetrisGame({ room, snap, asId }: { room: GameRoom; snap: RoomSnapshot; asId: string }) {
  const state = snap.state as TetrisState;
  const host = snap.role === "host";
  const me = state.players[asId];

  const scores = useMemo(() => {
    const out: Record<string, number> = {};
    for (const p of snap.players) {
      out[p.id] = state.players[p.id]?.score ?? 0;
    }
    return out;
  }, [snap.players, state.players]);

  // Host gravity scheduler: only send tick when something can change.
  useEffect(() => {
    if (!host) return;
    if (state.phase !== "playing") return;

    const nextAt = snap.players.reduce((acc, p) => {
      const ps = state.players[p.id];
      if (!ps || ps.status !== "playing") return acc;
      const dropMs = getDropMs(ps.level);
      return Math.min(acc, ps.lastFallAt + dropMs);
    }, Number.POSITIVE_INFINITY);

    if (!Number.isFinite(nextAt)) return;
    const delay = Math.max(0, nextAt - Date.now());
    const t = window.setTimeout(() => {
      room.sendAction({ type: "tick", at: Date.now() } satisfies TetrisAction);
    }, delay);

    return () => window.clearTimeout(t);
  }, [host, room, snap.players, state.phase, state.players]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = TETRIS_WIDTH * CELL * dpr;
    canvas.height = TETRIS_HEIGHT * CELL * dpr;
    canvas.style.width = `${TETRIS_WIDTH * CELL}px`;
    canvas.style.height = `${TETRIS_HEIGHT * CELL}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // background
    ctx.fillStyle = "#070b16";
    ctx.fillRect(0, 0, TETRIS_WIDTH * CELL, TETRIS_HEIGHT * CELL);

    // cells
    if (me) {
      for (let y = 0; y < TETRIS_HEIGHT; y += 1) {
        for (let x = 0; x < TETRIS_WIDTH; x += 1) {
          const id = me.board[y]?.[x] ?? 0;
          if (!id) continue;
          ctx.fillStyle = COLOR_BY_ID[id] ?? "#fff";
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
          ctx.strokeStyle = "rgba(255,255,255,0.08)";
          ctx.strokeRect(x * CELL, y * CELL, CELL, CELL);
        }
      }

      if (me.current) {
        const blocks = getTetrominoBlocks(me.current);
        for (const b of blocks) {
          if (b.y < 0) continue;
          if (b.y >= TETRIS_HEIGHT) continue;
          ctx.fillStyle = COLOR_BY_ID[b.color] ?? "#fff";
          ctx.fillRect(b.x * CELL, b.y * CELL, CELL, CELL);
          ctx.strokeStyle = "rgba(255,255,255,0.08)";
          ctx.strokeRect(b.x * CELL, b.y * CELL, CELL, CELL);
        }
      }
    }

    // frame
    ctx.strokeStyle = "rgba(246,239,228,0.12)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, TETRIS_WIDTH * CELL - 2, TETRIS_HEIGHT * CELL - 2);
  }, [me]);

  const sendInput = (input: TetrisInput) => {
    room.sendAction({ type: "input", input, at: Date.now() } satisfies TetrisAction, asId);
  };

  const gameOver = me?.status === "gameover";

  return (
    <div className="stack">
      <ScoreChips players={snap.players} scores={scores} />

      <div className="panel">
        <div className="row" style={{ alignItems: "center" }}>
          <div className="stack" style={{ gap: 6 }}>
            <b>Tus puntos</b>
            <span className="lede" style={{ margin: 0 }}>
              {me?.score ?? 0} · nivel {me?.level ?? 1}
            </span>
          </div>
          <div className="stack" style={{ alignItems: "flex-end", gap: 6 }}>
            <b>Estado</b>
            <span className="lede" style={{ margin: 0 }}>
              {state.phase === "match" ? "Fin" : gameOver ? "Game Over" : "Jugando"}
            </span>
          </div>
        </div>
      </div>

      <div className="stack" style={{ alignItems: "center" }}>
        <canvas ref={canvasRef} />
      </div>

      {state.phase === "playing" && !gameOver ? (
        <div className="tetris-controls">
          <div className="row">
            <Button variant="secondary" onClick={() => sendInput("left")} disabled={state.phase !== "playing"}>
              ←
            </Button>
            <Button variant="secondary" onClick={() => sendInput("right")} disabled={state.phase !== "playing"}>
              →
            </Button>
          </div>
          <div className="row">
            <Button variant="secondary" onClick={() => sendInput("rotate")} disabled={state.phase !== "playing"}>
              ↻
            </Button>
            <Button variant="secondary" onClick={() => sendInput("down")} disabled={state.phase !== "playing"}>
              ↓
            </Button>
            <Button variant="amber" onClick={() => sendInput("drop")} disabled={state.phase !== "playing"}>
              Drop
            </Button>
          </div>
        </div>
      ) : null}

      {state.phase === "match" ? (
        <div className="stack">
          <h2>Fin de la partida</h2>
          <p className="lede">Puntajes:</p>
          <div className="scores">
            {snap.players.map((p) => (
              <span key={p.id} className="chip">
                {p.name}: {scores[p.id] ?? 0}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

