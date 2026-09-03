import { useEffect } from "react";
import type { AdinvinaAction, AdinvinaState } from "./logic";
import { ADIVINA_ASK_MS } from "./logic";
import type { GameRoom } from "../../net/room";
import type { RoomSnapshot } from "../../net/room";
import { Button, ScoreChips } from "../../ui/kit";
import { ROUNDS } from "../shared";

export function AdinvinaGame({
  room,
  snap,
  asId,
}: {
  room: GameRoom;
  snap: RoomSnapshot;
  asId: string;
}) {
  const state = snap.state as AdinvinaState;
  const host = snap.role === "host";
  const myAnswer = state.answers[asId];

  useEffect(() => {
    if (!host) return;
    if (state.phase === "ask") {
      const t = window.setTimeout(
        () => room.sendAction({ type: "timeout", at: Date.now() } satisfies AdinvinaAction),
        ADIVINA_ASK_MS,
      );
      return () => window.clearTimeout(t);
    }
    if (state.phase === "result") {
      const t = window.setTimeout(
        () => room.sendAction({ type: "next" } satisfies AdinvinaAction),
        1600,
      );
      return () => window.clearTimeout(t);
    }
    return;
  }, [host, state.phase, room]);

  return (
    <div className="stack">
      <ScoreChips players={snap.players} scores={state.scores} />

      <p className="lede">
        {state.phase === "ask" ? (
          <>
            Ronda {state.round}/{ROUNDS}. Adiviná el famoso/objeto/categoría.
          </>
        ) : state.phase === "result" ? (
          <>Era {state.entryWord}.</>
        ) : (
          <>Fin.</>
        )}
      </p>

      {state.phase === "ask" ? (
        <div className="stack">
          <div className="scores">
            {state.clues.map((c) => (
              <span key={c} className="chip">
                {c}
              </span>
            ))}
          </div>

          <div className="stack" style={{ marginTop: 10 }}>
            <div className="row">
              {state.options.map((opt) => (
                <Button
                  key={opt}
                  variant={myAnswer?.choice === opt ? "amber" : "secondary"}
                  disabled={Boolean(myAnswer)}
                  onClick={() =>
                    room.sendAction(
                      { type: "answer", choice: opt, at: Date.now() } satisfies AdinvinaAction,
                      asId,
                    )
                  }
                >
                  {opt}
                </Button>
              ))}
            </div>
          </div>
          <p className="lede">La verificación es automática. Elegí una opción.</p>
        </div>
      ) : null}

      {state.phase === "result" || state.phase === "match" ? (
        <div className="stack">
          <h2>{state.phase === "match" ? "Fin" : "Correcto"}</h2>
          <p className="lede">
            Respuesta: <b>{state.entryWord}</b>
          </p>
          {snap.role === "host" && state.phase === "result" ? (
            <Button onClick={() => room.sendAction({ type: "next" } satisfies AdinvinaAction)}>
              Siguiente ronda
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

