import { useEffect, useState } from "react";
import type { TurboState } from "./logic";
import { ROUNDS } from "../shared";
import type { GameRoom } from "../../net/room";
import type { RoomSnapshot } from "../../net/room";
import { Button, ScoreChips, playerName } from "../../ui/kit";
import { RoundBanner } from "../../ui/SensorGate";
import { buzz } from "../../lib/sensors";

export function TurboGame({
  room,
  snap,
  asId,
}: {
  room: GameRoom;
  snap: RoomSnapshot;
  asId: string;
}) {
  const state = snap.state as TurboState;
  const host = snap.role === "host";
  const myTurn = !state.solo || asId === state.currentId;
  const taps = state.taps[asId] ?? 0;
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (!host || state.phase !== "race") return;
    const wait = Math.max(20, state.endAt - Date.now());
    const timer = window.setTimeout(() => room.sendAction({ type: "timeout" }), wait);
    return () => window.clearTimeout(timer);
  }, [host, state.phase, state.endAt, room]);

  useEffect(() => {
    if (state.phase !== "race") return;
    const tick = window.setInterval(() => setLeft(Math.max(0, state.endAt - Date.now())), 80);
    return () => window.clearInterval(tick);
  }, [state.phase, state.endAt]);

  useEffect(() => {
    if (!host || state.phase !== "result") return;
    const timer = window.setTimeout(() => room.sendAction({ type: "next" }), 1400);
    return () => window.clearTimeout(timer);
  }, [host, state.phase, state.round, state.currentId, room]);

  const tap = () => {
    if (!myTurn || state.phase !== "race") return;
    buzz(10);
    room.sendAction({ type: "tap" }, asId);
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
          <p className="lede">Ocho segundos. El teléfono cuenta cada toque. Nada de “yo hice más”.</p>
          <Button disabled={!myTurn} onClick={() => room.sendAction({ type: "start", at: Date.now() }, asId)}>
            A machacar
          </Button>
        </>
      ) : null}
      {state.phase === "race" ? (
        <button type="button" className="tap-pad" onPointerDown={tap} disabled={!myTurn}>
          <b>{taps}</b>
          <span>{myTurn ? "tocá" : "esperá"}</span>
          <small>{(left / 1000).toFixed(1)}s</small>
        </button>
      ) : null}
      {state.phase === "result" || state.phase === "match" ? (
        <div className="stack">
          <h2>{state.phase === "match" ? "Fin del sprint" : "Toques"}</h2>
          {snap.players.map((player) => (
            <p key={player.id}>
              {player.name}: {state.taps[player.id] ?? 0}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
