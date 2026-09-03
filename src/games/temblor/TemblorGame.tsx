import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { TemblorState } from "./logic";
import { ROUNDS } from "../shared";
import type { GameRoom } from "../../net/room";
import type { RoomSnapshot } from "../../net/room";
import { Button, ScoreChips, playerName } from "../../ui/kit";
import { RoundBanner, SensorGate } from "../../ui/SensorGate";
import { pointerBurst, subscribeShake } from "../../lib/sensors";

export function TemblorGame({
  room,
  snap,
  asId,
}: {
  room: GameRoom;
  snap: RoomSnapshot;
  asId: string;
}) {
  const state = snap.state as TemblorState;
  const host = snap.role === "host";
  const myTurn = !state.solo || asId === state.currentId;
  const energy = state.energy[asId] ?? 0;

  useEffect(() => {
    if (!host || state.phase !== "shake") return;
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
    room.sendAction({ type: "tick", energy: value }, asId);
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
          <p className="lede">Ocho segundos. El acelerómetro suma cada sacudida. El más tembloroso gana.</p>
          <Button disabled={!myTurn} onClick={() => room.sendAction({ type: "start", at: Date.now() }, asId)}>
            Agitar
          </Button>
        </>
      ) : null}
      {state.phase === "shake" && myTurn ? (
        <SensorGate
          fallback={<ShakeSurface live={false} energy={energy} endAt={state.endAt} onEnergy={report} />}
        >
          <ShakeSurface live energy={energy} endAt={state.endAt} onEnergy={report} />
        </SensorGate>
      ) : null}
      {state.phase === "shake" && !myTurn ? (
        <p className="lede">Esperá. El teléfono del otro está midiendo.</p>
      ) : null}
      {state.phase === "result" || state.phase === "match" ? (
        <div className="stack">
          <h2>{state.phase === "match" ? "Suelo firme" : "Sacudida"}</h2>
          {snap.players.map((player) => (
            <p key={player.id}>
              {player.name}: {Math.round(state.energy[player.id] ?? 0)}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ShakeSurface({
  live,
  energy,
  endAt,
  onEnergy,
}: {
  live: boolean;
  energy: number;
  endAt: number;
  onEnergy: (energy: number) => void;
}) {
  const total = useRef(energy);
  const last = useRef(0);
  const prev = useRef<{ x: number; y: number; t: number } | null>(null);
  const onEnergyRef = useRef(onEnergy);
  const [left, setLeft] = useState(Math.max(0, endAt - Date.now()));
  onEnergyRef.current = onEnergy;

  useEffect(() => {
    total.current = energy;
  }, [energy]);

  useEffect(() => {
    const tick = window.setInterval(() => setLeft(Math.max(0, endAt - Date.now())), 100);
    return () => window.clearInterval(tick);
  }, [endAt]);

  useEffect(() => {
    if (!live) return;
    return subscribeShake((burst) => {
      total.current += burst;
      const now = Date.now();
      if (now - last.current > 80) {
        last.current = now;
        onEnergyRef.current(total.current);
      }
    });
  }, [live]);

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (live) return;
    const next = pointerBurst(prev.current, event.clientX, event.clientY, event.timeStamp);
    prev.current = next.next;
    if (next.burst <= 0) return;
    total.current += next.burst;
    const now = Date.now();
    if (now - last.current > 80) {
      last.current = now;
      onEnergyRef.current(total.current);
    }
  };

  const fill = Math.min(100, energy / 1.8);

  return (
    <div
      className="shake-pad"
      onPointerMove={onMove}
      onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
    >
      <div className="meter">
        <div className="meter-fill" style={{ height: `${fill}%` }} />
      </div>
      <div className="shake-copy">
        <b>{Math.round(energy)}</b>
        <span>{live ? "sacudí el celu" : "pasá el dedo a lo loco"}</span>
        <small>{(left / 1000).toFixed(1)}s</small>
      </div>
    </div>
  );
}
