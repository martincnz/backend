import { useEffect } from "react";
import type { CinturonState } from "./logic";
import { FALSE_START, ROUNDS } from "../shared";
import type { GameRoom } from "../../net/room";
import type { RoomSnapshot } from "../../net/room";
import { Button, ScoreChips, playerName } from "../../ui/kit";
import { RoundBanner } from "../../ui/SensorGate";
import { buzz } from "../../lib/sensors";

export function CinturonGame({
  room,
  snap,
  asId,
}: {
  room: GameRoom;
  snap: RoomSnapshot;
  asId: string;
}) {
  const state = snap.state as CinturonState;
  const host = snap.role === "host";
  const myTurn = !state.solo || asId === state.currentId;
  const mine = state.times[asId];

  useEffect(() => {
    if (!host || state.phase !== "wait") return;
    const wait = Math.max(20, state.waitMs - (Date.now() - state.waitStartedAt));
    const timer = window.setTimeout(() => {
      room.sendAction({ type: "go", at: Date.now() });
    }, wait);
    return () => window.clearTimeout(timer);
  }, [host, state.phase, state.waitMs, state.waitStartedAt, state.round, state.currentId, room]);

  useEffect(() => {
    if (!host || state.phase !== "go") return;
    const timer = window.setTimeout(() => room.sendAction({ type: "timeout" }), 2200);
    return () => window.clearTimeout(timer);
  }, [host, state.phase, state.goAt, room]);

  useEffect(() => {
    if (!host || state.phase !== "result") return;
    const timer = window.setTimeout(() => room.sendAction({ type: "next" }), 1500);
    return () => window.clearTimeout(timer);
  }, [host, state.phase, state.round, state.currentId, state.lastId, room]);

  const tap = () => {
    if (!myTurn) return;
    if (state.phase !== "wait" && state.phase !== "go") return;
    if (mine !== undefined) return;
    buzz(state.phase === "go" ? 18 : 70);
    room.sendAction({ type: "tap", at: Date.now() }, asId);
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
          <p className="lede">El celular espera un toque al azar. Si tocás antes, falta.</p>
          <Button disabled={!myTurn} onClick={() => room.sendAction({ type: "ready" }, asId)}>
            Listo, cinturón abrochado
          </Button>
        </>
      ) : null}
      {state.phase === "wait" || state.phase === "go" ? (
        <button
          type="button"
          className={`go-pad ${state.phase === "go" ? "now" : "hold"}`}
          onPointerDown={tap}
        >
          <span>{state.phase === "go" ? "YA" : "esperá"}</span>
        </button>
      ) : null}
      {state.phase === "result" || state.phase === "match" ? (
        <div className="stack">
          <h2>{state.phase === "match" ? "Fin de ruta" : "El celu midió"}</h2>
          {snap.players.map((player) => {
            const time = state.times[player.id];
            return (
              <p key={player.id}>
                {player.name}: {formatTime(time)}
              </p>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function formatTime(time: number | undefined): string {
  if (time === undefined) return "…";
  if (time >= FALSE_START) return "falta";
  return `${time} ms`;
}
