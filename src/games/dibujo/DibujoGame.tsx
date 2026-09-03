import { useEffect, useRef, type PointerEvent } from "react";
import type { DibujoState, Point, Stroke } from "./logic";
import type { GameRoom } from "../../net/room";
import type { RoomSnapshot } from "../../net/room";
import { Button, ScoreChips, playerName } from "../../ui/kit";

export function DibujoGame({
  room,
  snap,
  asId,
}: {
  room: GameRoom;
  snap: RoomSnapshot;
  asId: string;
}) {
  const state = snap.state as DibujoState;
  const drawer = asId === state.drawerId;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokeRef = useRef<Stroke | null>(null);
  const lastSend = useRef(0);

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
    for (const stroke of state.strokes) {
      if (stroke.points.length === 0) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.beginPath();
      stroke.points.forEach((p, i) => {
        const x = p.x * rect.width;
        const y = p.y * rect.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }, [state.strokes, state.round, state.phase]);

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
    if (!drawer || state.phase !== "draw") return;
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
    strokeRef.current = {
      ...strokeRef.current,
      points: [...strokeRef.current.points, p],
    };
    const now = Date.now();
    if (now - lastSend.current > 40) {
      lastSend.current = now;
      room.sendAction({ type: "stroke", stroke: strokeRef.current }, asId);
    }
  };

  const onUp = () => {
    if (!strokeRef.current) return;
    room.sendAction({ type: "stroke", stroke: strokeRef.current }, asId);
    strokeRef.current = null;
  };

  return (
    <div className="stack">
      <ScoreChips players={snap.players} scores={state.scores} />
      <p className="lede">
        Dibuja {playerName(snap.players, state.drawerId)}
        {drawer && state.word ? ` · la palabra es “${state.word}”` : ""}
      </p>
      {state.phase === "pick" && drawer ? (
        <div className="stack">
          <h2>Elegí qué dibujar</h2>
          {state.options.map((word) => (
            <Button key={word} variant="secondary" onClick={() => room.sendAction({ type: "pick", word }, asId)}>
              {word}
            </Button>
          ))}
        </div>
      ) : null}
      {state.phase === "pick" && !drawer ? (
        <p className="lede">El dibujante está eligiendo palabra…</p>
      ) : null}
      {state.phase === "draw" || state.phase === "reveal" ? (
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
      {state.phase === "draw" && !drawer ? (
        <div className="stack">
          <p className="lede">Elegí la palabra:</p>
          <div className="row">
            {state.options.map((opt) => (
              <Button
                key={opt}
                variant="secondary"
                onClick={() => room.sendAction({ type: "guess", text: opt }, asId)}
              >
                {opt}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="guess-list">
        {state.guesses.map((g, i) => (
          <div key={`${g.from}-${i}`} className={g.ok ? "ok" : undefined}>
            {playerName(snap.players, g.from)}: {g.text}
          </div>
        ))}
      </div>
      {state.phase === "reveal" ? (
        <>
          <h2>Era “{state.word}”</h2>
          {snap.role === "host" ? (
            <Button onClick={() => room.sendAction({ type: "next" })}>Siguiente dibujante</Button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
