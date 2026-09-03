import { QUESTIONS } from "./data";
import type { TrivialState } from "./logic";
import type { GameRoom } from "../../net/room";
import type { RoomSnapshot } from "../../net/room";
import { Button, ScoreChips, playerName } from "../../ui/kit";

export function TrivialGame({
  room,
  snap,
  asId,
}: {
  room: GameRoom;
  snap: RoomSnapshot;
  asId: string;
}) {
  const state = snap.state as TrivialState;
  const qIndex = state.order[Math.min(state.index, state.order.length - 1)] ?? 0;
  const question = QUESTIONS[qIndex];
  if (!question) return null;
  const locked = Boolean(state.locked[asId]);

  if (state.phase === "done") {
    const winner = [...snap.players].sort(
      (a, b) => (state.scores[b.id] ?? 0) - (state.scores[a.id] ?? 0),
    )[0];
    return (
      <div className="stack">
        <ScoreChips players={snap.players} scores={state.scores} />
        <h2>Ganó {winner ? playerName(snap.players, winner.id) : "el azar"}</h2>
      </div>
    );
  }

  return (
    <div className="stack">
      <ScoreChips players={snap.players} scores={state.scores} />
      <p className="lede">
        Pregunta {Math.min(state.index + 1, state.order.length)}/{state.order.length}
      </p>
      <h2>{question.q}</h2>
      {question.options.map((opt, i) => {
        const show = state.phase === "reveal";
        const mine = state.answers[asId] === i;
        const correct = i === question.ok;
        return (
          <Button
            key={opt}
            variant={show && correct ? "mint" : mine ? "amber" : "secondary"}
            disabled={state.phase !== "ask" || locked}
            onClick={() => room.sendAction({ type: "answer", choice: i }, asId)}
          >
            {opt}
          </Button>
        );
      })}
      {state.phase === "ask" && locked ? <p className="lede">Respuesta mandada. Esperando al resto.</p> : null}
      {state.phase === "reveal" && snap.role === "host" ? (
        <Button onClick={() => room.sendAction({ type: "next" })}>Siguiente</Button>
      ) : null}
    </div>
  );
}
