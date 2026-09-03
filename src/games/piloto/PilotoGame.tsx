import { useEffect, useRef, useState, type PointerEvent } from "react";
import { GREEN_DEG, type PilotoState } from "./logic";
import { ROUNDS } from "../shared";
import type { GameRoom } from "../../net/room";
import type { RoomSnapshot } from "../../net/room";
import { Button, ScoreChips, playerName } from "../../ui/kit";
import { RoundBanner, SensorGate } from "../../ui/SensorGate";
import { subscribeTilt } from "../../lib/sensors";

export function PilotoGame({
  room,
  snap,
  asId,
}: {
  room: GameRoom;
  snap: RoomSnapshot;
  asId: string;
}) {
  const state = snap.state as PilotoState;
  const host = snap.role === "host";
  const myTurn = !state.solo || asId === state.currentId;
  const greenMs = state.greenMs[asId] ?? 0;

  useEffect(() => {
    if (!host || state.phase !== "fly") return;
    const wait = Math.max(20, state.endAt - Date.now());
    const timer = window.setTimeout(() => room.sendAction({ type: "timeout" }), wait);
    return () => window.clearTimeout(timer);
  }, [host, state.phase, state.endAt, room]);

  useEffect(() => {
    if (!host || state.phase !== "result") return;
    const timer = window.setTimeout(() => room.sendAction({ type: "next" }), 1400);
    return () => window.clearTimeout(timer);
  }, [host, state.phase, state.round, state.currentId, room]);

  const report = (value: number) => {
    room.sendAction({ type: "tick", greenMs: value }, asId);
  };

  return (
    <div className="stack">
      <ScoreChips players={snap.players} scores={state.scores} />
      <RoundBanner
        round={state.round}
        total={ROUNDS}
        turn={playerName(snap.players, state.currentId)}
        solo={state.solo}
      />
      {state.phase === "arm" ? (
        <>
          <p className="lede">
            Ocho segundos. Incliná el celular y mantené el avión en el corredor verde. El
            giroscopio es el juez.
          </p>
          <Button disabled={!myTurn} onClick={() => room.sendAction({ type: "start", at: Date.now() }, asId)}>
            Despegar
          </Button>
        </>
      ) : null}
      {state.phase === "fly" && myTurn ? (
        <SensorGate
          fallback={<TiltSurface live={false} greenMs={greenMs} endAt={state.endAt} onGreen={report} />}
        >
          <TiltSurface live greenMs={greenMs} endAt={state.endAt} onGreen={report} />
        </SensorGate>
      ) : null}
      {state.phase === "fly" && !myTurn ? (
        <p className="lede">Turbulencia ajena. Esperá tu turno.</p>
      ) : null}
      {state.phase === "result" || state.phase === "match" ? (
        <div className="stack">
          <h2>{state.phase === "match" ? "Aterrizaje" : "En verde"}</h2>
          {snap.players.map((player) => (
            <p key={player.id}>
              {player.name}: {state.greenMs[player.id] ?? 0} ms
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TiltSurface({
  live,
  greenMs,
  endAt,
  onGreen,
}: {
  live: boolean;
  greenMs: number;
  endAt: number;
  onGreen: (greenMs: number) => void;
}) {
  const [gamma, setGamma] = useState(0);
  const [left, setLeft] = useState(Math.max(0, endAt - Date.now()));
  const accum = useRef(greenMs);
  const gammaRef = useRef(0);
  const lastSample = useRef(performance.now());
  const lastSend = useRef(0);
  const onGreenRef = useRef(onGreen);
  onGreenRef.current = onGreen;
  gammaRef.current = gamma;

  useEffect(() => {
    accum.current = greenMs;
  }, [greenMs]);

  useEffect(() => {
    const tick = window.setInterval(() => setLeft(Math.max(0, endAt - Date.now())), 100);
    return () => window.clearInterval(tick);
  }, [endAt]);

  useEffect(() => {
    if (!live) return;
    lastSample.current = performance.now();
    return subscribeTilt((next) => setGamma(next));
  }, [live]);

  useEffect(() => {
    lastSample.current = performance.now();
    let frame = 0;
    const loop = (now: number) => {
      const dt = now - lastSample.current;
      lastSample.current = now;
      if (Math.abs(gammaRef.current) <= GREEN_DEG) accum.current += dt;
      if (now - lastSend.current > 90) {
        lastSend.current = now;
        onGreenRef.current(Math.round(accum.current));
      }
      frame = window.requestAnimationFrame(loop);
    };
    frame = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (live) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    setGamma((x - 0.5) * 90);
  };

  const inGreen = Math.abs(gamma) <= GREEN_DEG;
  const plane = 50 + (gamma / 45) * 42;

  return (
    <div
      className={`tilt-pad ${inGreen ? "green" : "red"}`}
      onPointerMove={onMove}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onMove(event);
      }}
    >
      <div className="horizon">
        <div className="green-zone" />
        <div className="plane" style={{ left: `${Math.max(6, Math.min(94, plane))}%` }}>
          ✈
        </div>
      </div>
      <div className="shake-copy">
        <b>{Math.round(accum.current)} ms</b>
        <span>{live ? "incliná el celu" : "deslizá para dirigir"}</span>
        <small>{(left / 1000).toFixed(1)}s</small>
      </div>
    </div>
  );
}
