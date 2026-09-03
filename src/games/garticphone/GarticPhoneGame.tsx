import { useEffect, useRef, type PointerEvent } from "react";
import type { GarticPhoneAction, GarticPhoneState } from "./logic";
import {
  GARTICPHONE_DRAW_MS,
  GARTICPHONE_GUESS_MS,
} from "./logic";
import type { Point, Stroke } from "../dibujo/logic";
import type { GameRoom } from "../../net/room";
import type { RoomSnapshot } from "../../net/room";
import { Button, ScoreChips, playerName } from "../../ui/kit";
import { ROUNDS } from "../shared";

export function GarticPhoneGame({
  room,
  snap,
  asId,
}: {
  room: GameRoom;
  snap: RoomSnapshot;
  asId: string;
}) {
  const state = snap.state as GarticPhoneState;
  const host = snap.role === "host";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokeRef = useRef<Stroke | null>(null);
  const lastSend = useRef(0);

  const drawerId = state.drawerId;
  const isMyTurn = asId === state.drawerId;

  const strokesToRender: Stroke[] = (() => {
    if (state.phase === "draw") {
      const prev = state.stage === 0 ? [] : state.drawings[state.stage - 1];
      const mine = state.drawings[state.stage];
      return isMyTurn ? [...prev, ...mine] : prev;
    }
    // guess + result show the last drawing
    return state.drawings[2];
  })();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#f3ead9";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of strokesToRender) {
      if (stroke.points.length === 0) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.beginPath();
      stroke.points.forEach((p: Point, i: number) => {
        const x = p.x * rect.width;
        const y = p.y * rect.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }, [state.phase, state.stage, state.drawings, isMyTurn, strokesToRender]);

  useEffect(() => {
    if (!host) return;
    if (state.phase === "draw") {
      const t = window.setTimeout(() => {
        room.sendAction({ type: "timeout", at: Date.now() } satisfies GarticPhoneAction);
      }, GARTICPHONE_DRAW_MS);
      return () => window.clearTimeout(t);
    }
    if (state.phase === "guess") {
      const t = window.setTimeout(() => {
        room.sendAction({ type: "timeout", at: Date.now() } satisfies GarticPhoneAction);
      }, GARTICPHONE_GUESS_MS);
      return () => window.clearTimeout(t);
    }
    if (state.phase === "result") {
      const t = window.setTimeout(() => room.sendAction({ type: "next" } satisfies GarticPhoneAction), 1600);
      return () => window.clearTimeout(t);
    }
    return;
  }, [host, state.phase, room, asId]);

  const pointFromEvent = (ev: PointerEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (ev.clientX - rect.left) / rect.width,
      y: (ev.clientY - rect.top) / rect.height,
    };
  };

  const onDown = (ev: PointerEvent<HTMLCanvasElement>) => {
    if (!isMyTurn || state.phase !== "draw") return;
    ev.currentTarget.setPointerCapture(ev.pointerId);
    const p = pointFromEvent(ev);
    if (!p) return;
    strokeRef.current = {
      id: `${asId}-${Date.now()}`,
      color: "#0b1020",
      width: 4,
      points: [p],
    };
  };

  const onMove = (ev: PointerEvent<HTMLCanvasElement>) => {
    if (!strokeRef.current) return;
    const p = pointFromEvent(ev);
    if (!p) return;
    const nextStroke: Stroke = {
      ...strokeRef.current,
      points: [...strokeRef.current.points, p],
    };
    strokeRef.current = nextStroke;
    const now = Date.now();
    if (now - lastSend.current > 40) {
      lastSend.current = now;
      room.sendAction({ type: "stroke", stroke: nextStroke } satisfies GarticPhoneAction, asId);
    }
  };

  const onUp = () => {
    if (!strokeRef.current) return;
    room.sendAction({ type: "stroke", stroke: strokeRef.current } satisfies GarticPhoneAction, asId);
    strokeRef.current = null;
  };

  return (
    <div className="stack">
      <ScoreChips players={snap.players} scores={state.scores} />
      <p className="lede">
        {state.phase === "draw" ? (
          <>
            Ronda {state.round}/{ROUNDS}. Turno de <b>{playerName(snap.players, drawerId)}</b>.{" "}
            {state.stage === 0
              ? "Dibujá la palabra secreta."
              : "Dibujá lo que te sugiere el dibujo anterior."}
          </>
        ) : state.phase === "guess" ? (
          <>
            Ronda {state.round}/{ROUNDS}. Ahora adiviná la palabra secreta.
          </>
        ) : (
          <>Resultado: {playerName(snap.players, drawerId)} ya pasó.</>
        )}
      </p>

      {state.phase === "draw" && state.stage === 0 && isMyTurn ? (
        <div className="stack">
          <h2 style={{ marginTop: 4 }}>Tu palabra</h2>
          <p className="big-letter">{state.secretWord}</p>
        </div>
      ) : null}

      {state.phase === "draw" || state.phase === "guess" ? (
        <div className="canvas-wrap">
          <canvas
            ref={canvasRef}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          />
        </div>
      ) : null}

      {state.phase === "guess" ? (
        <div className="stack">
          <div className="row">
            {state.options.map((opt) => {
              const already = state.guesses[asId]?.choice === opt;
              return (
                <Button
                  key={opt}
                  variant={already ? "amber" : "secondary"}
                  disabled={Boolean(state.guesses[asId])}
                  onClick={() =>
                    room.sendAction({ type: "guess", choice: opt, at: Date.now() } satisfies GarticPhoneAction, asId)
                  }
                >
                  {opt}
                </Button>
              );
            })}
          </div>
          <p className="lede">
            Si elegís, queda registrado. No hace falta “confiar”: el juego verifica automático.
          </p>
        </div>
      ) : null}

      {state.phase === "result" || state.phase === "match" ? (
        <div className="stack">
          <h2>Era “{state.secretWord}”</h2>
          {snap.role === "host" ? (
            <Button onClick={() => room.sendAction({ type: "next" } satisfies GarticPhoneAction)}>
              {state.phase === "match" ? "Listo" : "Siguiente ronda"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

