import { useEffect, useMemo } from "react";
import type { TabooAction, TabooState } from "./logic";
import { TABOO_CLUES_MS, TABOO_GUESS_MS } from "./logic";
import type { GameRoom } from "../../net/room";
import type { RoomSnapshot } from "../../net/room";
import { Button, ScoreChips, playerName } from "../../ui/kit";
import { ROUNDS } from "../shared";

const CLUE_N = 3;

export function TabooGame({
  room,
  snap,
  asId,
}: {
  room: GameRoom;
  snap: RoomSnapshot;
  asId: string;
}) {
  const state = snap.state as TabooState;
  const host = snap.role === "host";
  const isDescriber = asId === state.describerId;
  const myGuess = state.guesses[asId];

  useEffect(() => {
    if (!host) return;
    if (state.phase === "clues") {
      const t = window.setTimeout(() => {
        room.sendAction({ type: "timeout", at: Date.now() } satisfies TabooAction);
      }, TABOO_CLUES_MS);
      return () => window.clearTimeout(t);
    }
    if (state.phase === "guess") {
      const t = window.setTimeout(() => {
        room.sendAction({ type: "timeout", at: Date.now() } satisfies TabooAction);
      }, TABOO_GUESS_MS);
      return () => window.clearTimeout(t);
    }
    if (state.phase === "result") {
      const t = window.setTimeout(() => {
        room.sendAction({ type: "next" } satisfies TabooAction);
      }, 1600);
      return () => window.clearTimeout(t);
    }
    return;
  }, [host, state.phase, room]);

  const canTapClue = state.phase === "clues" && isDescriber && !state.foul;
  const canGuess = state.phase === "guess" && !myGuess && !state.foul;

  const forbiddenSet = useMemo(() => new Set(state.forbiddenWords), [state.forbiddenWords]);

  return (
    <div className="stack">
      <ScoreChips players={snap.players} scores={state.scores} />
      <p className="lede">
        {state.phase === "clues" ? (
          <>
            Ronda {state.round}/{ROUNDS}. Describí sin decir{" "}
            <b>{playerName(snap.players, state.describerId)}</b>.
          </>
        ) : state.phase === "guess" ? (
          <>
            Ronda {state.round}/{ROUNDS}. Ahora adiviná con las pistas.
          </>
        ) : (
          <>Resultado.</>
        )}
      </p>

      {state.phase === "clues" && isDescriber ? (
        <div className="stack">
          <h2>Tu palabra</h2>
          <p className="big-letter" style={{ fontSize: 56 }}>
            {state.targetWord}
          </p>
          <div className="stack" style={{ gap: 8 }}>
            <div className="lede">
              Prohibidas: {state.forbiddenWords.map((w) => `“${w}”`).join(", ")}
            </div>
          </div>

          <div className="cards" style={{ marginTop: 8 }}>
            {state.clueBank.map((w) => {
              const isForbidden = forbiddenSet.has(w);
              const picked = state.selectedClues.includes(w);
              const disabled =
                !canTapClue || picked || state.selectedClues.length >= CLUE_N;
              return (
                <Button
                  key={w}
                  variant={picked ? "amber" : isForbidden ? "coral" : "secondary"}
                  disabled={disabled}
                  onClick={() =>
                    room.sendAction({ type: "clueTap", word: w } satisfies TabooAction, asId)
                  }
                >
                  {w}
                </Button>
              );
            })}
          </div>

          <p className="lede">
            Claves elegidas:{" "}
            <b>
              {state.selectedClues.length}/{CLUE_N}
            </b>
          </p>
          {state.selectedClues.length < CLUE_N ? (
            <p className="lede">El juego entra en adivinanza cuando completes {CLUE_N} claves.</p>
          ) : null}
        </div>
      ) : null}

      {state.phase === "clues" && !isDescriber ? (
        <div className="stack">
          <h2>Esperando pistas</h2>
          <p className="lede">
            El describidor está eligiendo {CLUE_N} claves. Vos solo adivinás cuando arranque la
            siguiente fase.
          </p>
          {state.selectedClues.length ? (
            <div className="scores">
              {state.selectedClues.map((c) => (
                <span key={c} className="chip">
                  “{c}”
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {state.phase === "guess" ? (
        <div className="stack">
          <h2>Pistas</h2>
          <div className="scores">
            {state.selectedClues.map((c) => (
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
                  variant={myGuess?.choice === opt ? "amber" : "secondary"}
                  disabled={!canGuess}
                  onClick={() =>
                    room.sendAction(
                      { type: "guess", choice: opt, at: Date.now() } satisfies TabooAction,
                      asId,
                    )
                  }
                >
                  {opt}
                </Button>
              ))}
            </div>
          </div>
          <p className="lede">
            La verificación es automática: el motor sabe la respuesta.
          </p>
        </div>
      ) : null}

      {state.phase === "result" || state.phase === "match" ? (
        <div className="stack">
          <h2>{state.foul ? "Falta (palabra prohibida)" : "Adivinanza"}</h2>
          <p className="lede">
            Era: <b>{state.targetWord}</b>
          </p>
          {snap.role === "host" ? (
            <Button disabled={state.phase === "match"} onClick={() => room.sendAction({ type: "next" } satisfies TabooAction)}>
              {state.phase === "match" ? "Fin" : "Siguiente ronda"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

