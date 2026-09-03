import { useEffect, useRef, useState } from "react";
import {
  BASTA_CATS,
  BASTA_LABELS,
  EMPTY_ANSWERS,
  type BastaAnswers,
  type BastaState,
} from "./logic";
import type { GameRoom } from "../../net/room";
import type { RoomSnapshot } from "../../net/room";
import { Button, ScoreChips } from "../../ui/kit";
import { useCountdown } from "../../ui/hooks";

export function BastaGame({
  room,
  snap,
  asId,
}: {
  room: GameRoom;
  snap: RoomSnapshot;
  asId: string;
}) {
  const state = snap.state as BastaState;
  const [answers, setAnswers] = useState<BastaAnswers>(EMPTY_ANSWERS);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const left = useCountdown(
    state.durationMs,
    state.phase === "write",
    `${state.round}-${state.letter}`,
  );
  const submitted = Boolean(state.submitted[asId]);

  useEffect(() => {
    if (state.phase === "write") setAnswers(EMPTY_ANSWERS);
  }, [state.phase, state.round]);

  useEffect(() => {
    if (state.phase === "write" && left === 0 && !submitted) {
      room.sendAction({ type: "submit", answers: answersRef.current }, asId);
    }
  }, [left, state.phase, submitted, room, asId]);

  return (
    <div className="stack">
      <ScoreChips players={snap.players} scores={state.scores} />
      {state.phase === "ready" || (state.phase === "match" && snap.role === "host") ? (
        <>
          <h2>{state.phase === "match" ? `Meta ${state.target}` : "¿Lista la letra?"}</h2>
          {snap.role === "host" ? (
            <Button onClick={() => room.sendAction({ type: "begin" })}>Sacar letra</Button>
          ) : (
            <p className="lede">Esperando la letra…</p>
          )}
        </>
      ) : null}
      {state.phase === "write" ? (
        <>
          <div className="big-letter">{state.letter}</div>
          <div className="timer">{Math.ceil(left / 1000)}s</div>
          {BASTA_CATS.map((cat) => (
            <label key={cat} className="field">
              <span>{BASTA_LABELS[cat]}</span>
              <input
                value={answers[cat]}
                disabled={submitted}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [cat]: e.target.value }))}
              />
            </label>
          ))}
          <div className="row">
            <Button
              variant="secondary"
              disabled={submitted}
              onClick={() => room.sendAction({ type: "submit", answers }, asId)}
            >
              Listo
            </Button>
            <Button
              variant="coral"
              disabled={submitted}
              onClick={() => room.sendAction({ type: "basta", answers }, asId)}
            >
              ¡BASTA!
            </Button>
          </div>
        </>
      ) : null}
      {state.phase === "reveal" || state.phase === "match" ? (
        <>
          <div className="big-letter">{state.letter}</div>
          {BASTA_CATS.map((cat) => (
            <div key={cat} className="panel">
              <b>{BASTA_LABELS[cat]}</b>
              {snap.players.map((p) => (
                <p key={p.id}>
                  {p.name}: {state.answers[p.id]?.[cat] || "—"}
                </p>
              ))}
            </div>
          ))}
          <p className="lede">
            Esta ronda:{" "}
            {snap.players
              .map((p) => `${p.name} +${state.roundPoints[p.id] ?? 0}`)
              .join(" · ")}
          </p>
          {state.phase === "reveal" && snap.role === "host" ? (
            <Button onClick={() => room.sendAction({ type: "next" })}>Siguiente letra</Button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
