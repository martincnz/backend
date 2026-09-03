import { useState } from "react";
import { RANKS, type Card, type MentirosoState, type Rank } from "./logic";
import type { GameRoom } from "../../net/room";
import type { RoomSnapshot } from "../../net/room";
import { Button, playerName } from "../../ui/kit";

function isRed(card: Card): boolean {
  return card.suit === "♥" || card.suit === "♦";
}

export function MentirosoGame({
  room,
  snap,
  asId,
}: {
  room: GameRoom;
  snap: RoomSnapshot;
  asId: string;
}) {
  const state = snap.state as MentirosoState;
  const hand = state.hands[asId] ?? [];
  const [picked, setPicked] = useState<string[]>([]);
  const [rank, setRank] = useState<Rank>("A");
  const myTurn = state.phase === "play" && state.currentId === asId;
  const myCall = state.phase === "call" && state.callerId === asId;

  const toggle = (id: string) => {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  if (state.phase === "over") {
    return (
      <h2>
        {state.winnerId ? `${playerName(snap.players, state.winnerId)} se quedó sin cartas` : "Fin"}
      </h2>
    );
  }

  return (
    <div className="stack">
      <p className="lede">
        Mazo en la mesa: {state.pile.length}.{" "}
        {state.lastPlay
          ? `${playerName(snap.players, state.lastPlay.from)} dijo ${state.lastPlay.count} ${state.lastPlay.rank}`
          : "Nadie tiró todavía."}
      </p>
      {state.lastReveal ? (
        <p className={state.lastTruth ? "ok" : "bad"}>
          Era {state.lastTruth ? "verdad" : "mentira"}:{" "}
          {state.lastReveal.map((c) => `${c.rank}${c.suit}`).join(" ")}
        </p>
      ) : null}
      <div className="scores">
        {snap.players.map((p) => (
          <span key={p.id} className="chip">
            {p.name} · {state.hands[p.id]?.length ?? 0}
          </span>
        ))}
      </div>
      <div className="cards">
        {hand.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`card ${isRed(card) ? "red" : ""} ${picked.includes(card.id) ? "sel" : ""}`}
            onClick={() => toggle(card.id)}
          >
            {card.rank}
            {card.suit}
          </button>
        ))}
      </div>
      {myTurn ? (
        <>
          <label className="field">
            <span>Declaro que son</span>
            <select value={rank} onChange={(e) => setRank(e.target.value as Rank)}>
              {RANKS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <Button
            disabled={picked.length === 0}
            onClick={() => {
              room.sendAction({ type: "play", cardIds: picked, rank }, asId);
              setPicked([]);
            }}
          >
            Tirar {picked.length || 0}
          </Button>
        </>
      ) : null}
      {myCall ? (
        <div className="row">
          <Button variant="mint" onClick={() => room.sendAction({ type: "trust" }, asId)}>
            Te creo
          </Button>
          <Button variant="coral" onClick={() => room.sendAction({ type: "lie" }, asId)}>
            ¡Mentira!
          </Button>
        </div>
      ) : (
        <p className="lede">
          {state.phase === "play"
            ? `Juega ${playerName(snap.players, state.currentId)}`
            : `Decide ${playerName(snap.players, state.callerId ?? "")}`}
        </p>
      )}
    </div>
  );
}
