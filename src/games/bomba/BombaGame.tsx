import { useEffect, useState } from "react";
import type { BombaState } from "./logic";
import type { GameRoom } from "../../net/room";
import type { RoomSnapshot } from "../../net/room";
import { Button, playerName } from "../../ui/kit";
import { useCountdown } from "../../ui/hooks";

export function BombaGame({
  room,
  snap,
  asId,
}: {
  room: GameRoom;
  snap: RoomSnapshot;
  asId: string;
}) {
  const state = snap.state as BombaState;
  const [text, setText] = useState("");
  const mine = asId === state.currentId;
  const left = useCountdown(
    state.turnMs,
    state.phase === "play",
    `${state.turn}-${state.syllable}`,
  );

  useEffect(() => {
    setText("");
  }, [state.turn]);

  useEffect(() => {
    if (state.phase === "play" && left === 0) {
      room.sendAction({ type: "timeout", turn: state.turn }, asId);
    }
  }, [left, state.phase, state.turn, room, asId]);

  if (state.phase === "over") {
    return (
      <div className="stack">
        <h2>Ganó {state.winnerId ? playerName(snap.players, state.winnerId) : "nadie"}</h2>
        {snap.role === "host" ? (
          <p className="lede">Volvé al lobby para otra ronda.</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="scores">
        {snap.players.map((p) => (
          <span key={p.id} className="chip">
            {p.name} {"♥".repeat(state.lives[p.id] ?? 0)}
          </span>
        ))}
      </div>
      <p className="lede">Turno de {playerName(snap.players, state.currentId)}</p>
      <div className="big-letter">{state.syllable}</div>
      <div className="timer">{Math.ceil(left / 1000)}s</div>
      {state.lastWord ? (
        <p className="ok">
          {state.lastFrom ? playerName(snap.players, state.lastFrom) : ""} dijo {state.lastWord}
        </p>
      ) : null}
      <input
        value={text}
        disabled={!mine}
        onChange={(e) => setText(e.target.value)}
        placeholder={mine ? "palabra con esa sílaba" : "esperá"}
        onKeyDown={(e) => {
          if (e.key === "Enter" && text.trim()) {
            room.sendAction({ type: "word", text }, asId);
          }
        }}
      />
      <Button
        disabled={!mine || !text.trim()}
        onClick={() => room.sendAction({ type: "word", text }, asId)}
      >
        Mandar
      </Button>
    </div>
  );
}
