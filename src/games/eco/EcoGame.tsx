import { useEffect, useState } from "react";
import { ECO_PADS, type EcoState } from "./logic";
import type { GameRoom } from "../../net/room";
import type { RoomSnapshot } from "../../net/room";
import { ScoreChips, playerName } from "../../ui/kit";
import { buzz } from "../../lib/sensors";

const PAD_LABEL = ["▲", "●", "■", "◆"];
const PAD_CLASS = ["eco-a", "eco-b", "eco-c", "eco-d"];

export function EcoGame({
  room,
  snap,
  asId,
}: {
  room: GameRoom;
  snap: RoomSnapshot;
  asId: string;
}) {
  const state = snap.state as EcoState;
  const host = snap.role === "host";
  const mine = state.progress[asId];
  const myTurn = !state.solo || asId === state.currentId;
  const [lit, setLit] = useState<number | null>(null);
  const [watching, setWatching] = useState(false);
  const level = mine?.level ?? 0;
  const input = mine?.input ?? 0;
  const dead = Boolean(mine?.dead);

  useEffect(() => {
    if (!host || state.phase !== "result") return;
    const timer = window.setTimeout(() => room.sendAction({ type: "next" }), 1400);
    return () => window.clearTimeout(timer);
  }, [host, state.phase, state.currentId, room]);

  useEffect(() => {
    if (!myTurn || !mine || dead || state.phase !== "play" || input !== 0) {
      setWatching(false);
      setLit(null);
      return;
    }
    const pads = state.sequence.slice(0, level);
    let index = 0;
    let timer = 0;
    let cancelled = false;
    setWatching(true);
    const show = () => {
      if (cancelled) return;
      if (index >= pads.length) {
        setLit(null);
        setWatching(false);
        return;
      }
      const pad = pads[index] ?? 0;
      setLit(pad);
      buzz(28);
      index += 1;
      timer = window.setTimeout(() => {
        if (cancelled) return;
        setLit(null);
        timer = window.setTimeout(show, 160);
      }, 380);
    };
    timer = window.setTimeout(show, 420);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [myTurn, dead, input, level, state.phase, state.sequence, state.currentId]);

  const press = (pad: number) => {
    if (!myTurn || watching || !mine || mine.dead || state.phase !== "play") return;
    buzz(16);
    room.sendAction({ type: "press", pad }, asId);
  };

  return (
    <div className="stack">
      <ScoreChips players={snap.players} scores={liveScores(state)} />
      <p className="lede">
        {state.solo ? (
          <>
            Turno de <b>{playerName(snap.players, state.currentId)}</b>
          </>
        ) : (
          "Todos a la vez, misma secuencia"
        )}
        . El celu muestra, vibra y valida. Nivel {mine?.level ?? 1}.
      </p>
      {state.phase === "play" && myTurn && mine && !mine.dead ? (
        <div className="eco-grid">
          {Array.from({ length: ECO_PADS }, (_, pad) => (
            <button
              key={pad}
              type="button"
              className={`eco-pad ${PAD_CLASS[pad] ?? ""} ${lit === pad ? "lit" : ""}`}
              disabled={watching}
              onPointerDown={() => press(pad)}
            >
              {PAD_LABEL[pad]}
            </button>
          ))}
        </div>
      ) : null}
      {state.phase === "play" && (!myTurn || mine?.dead) ? (
        <p className="lede">
          {mine?.dead
            ? `Llegaste al nivel ${mine.score}.`
            : `Pasá el celu a ${playerName(snap.players, state.currentId)}.`}
        </p>
      ) : null}
      {state.phase === "result" || state.phase === "match" ? (
        <div className="stack">
          <h2>{state.phase === "match" ? "Memoria de cabina" : "Fin de turno"}</h2>
          {snap.players.map((player) => (
            <p key={player.id}>
              {player.name}: nivel {state.progress[player.id]?.score ?? 0}
              {state.progress[player.id]?.dead ? "" : " · jugando"}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function liveScores(state: EcoState): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const [id, progress] of Object.entries(state.progress)) {
    scores[id] = progress.score;
  }
  return scores;
}
