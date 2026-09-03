import type { MenteState } from "./logic";
import type { GameRoom } from "../../net/room";
import type { RoomSnapshot } from "../../net/room";
import { Button, playerName } from "../../ui/kit";

export function MenteGame({
  room,
  snap,
  asId,
}: {
  room: GameRoom;
  snap: RoomSnapshot;
  asId: string;
}) {
  const state = snap.state as MenteState;
  const hand = state.hands[asId] ?? [];
  return (
    <div className="stack">
      <p className="lede">
        Nivel {state.level}/{state.maxLevel} · vidas {state.lives}
      </p>
      <p className="lede">Jugá tu carta más baja cuando sientas que es el momento. Sin hablar.</p>
      <div className="cards">
        {hand.map((n) => (
          <div key={n} className="card">
            {n}
          </div>
        ))}
      </div>
      {state.phase === "play" ? (
        <Button disabled={hand.length === 0} onClick={() => room.sendAction({ type: "play" }, asId)}>
          Jugar {hand[0] ?? ""}
        </Button>
      ) : null}
      <div className="guess-list">
        {state.played.map((p, i) => (
          <div key={`${p.from}-${i}`}>
            {playerName(snap.players, p.from)} tiró {p.value}
          </div>
        ))}
      </div>
      {state.phase === "level" ? (
        <>
          <h2>Nivel limpio</h2>
          {snap.role === "host" ? (
            <Button onClick={() => room.sendAction({ type: "continue" })}>Siguiente nivel</Button>
          ) : (
            <p className="lede">Esperando al anfitrión…</p>
          )}
        </>
      ) : null}
      {state.phase === "won" ? <h2>Salieron del pozo. Imposible, y sin embargo.</h2> : null}
      {state.phase === "lost" ? <h2>Se apagó el cartel de cinturones. Otra vez.</h2> : null}
    </div>
  );
}
