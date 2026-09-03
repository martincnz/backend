import type { GameId, Player } from "../types";
import { assertNever } from "../types";
import { initBasta, reduceBasta, type BastaAction, type BastaState } from "./basta/logic";
import { initDibujo, reduceDibujo, type DibujoAction, type DibujoState } from "./dibujo/logic";
import { initBomba, reduceBomba, type BombaAction, type BombaState } from "./bomba/logic";
import { initMente, reduceMente, type MenteAction, type MenteState } from "./mente/logic";
import { initTrivial, reduceTrivial, type TrivialAction, type TrivialState } from "./trivial/logic";
import {
  initMentiroso,
  reduceMentiroso,
  type MentirosoAction,
  type MentirosoState,
} from "./mentiroso/logic";

export type AnyGameState =
  | BastaState
  | DibujoState
  | BombaState
  | MenteState
  | TrivialState
  | MentirosoState;

export const GAMES: Array<{
  id: GameId;
  title: string;
  blurb: string;
  tag: string;
}> = [
  {
    id: "basta",
    title: "Basta",
    blurb: "Una letra, seis categorías. El primero que llena todo grita BASTA.",
    tag: "clásico",
  },
  {
    id: "dibujo",
    title: "Ventanilla",
    blurb: "Uno dibuja, los otros adivinan. Nada de palabras, solo garabatos.",
    tag: "lápiz",
  },
  {
    id: "bomba",
    title: "Sílabomba",
    blurb: "Escribí una palabra con la sílaba antes de que explote el turno.",
    tag: "velocidad",
  },
  {
    id: "mente",
    title: "La Mente",
    blurb: "Jugá los números en orden. Sin hablar. Cooperativos contra el mazo.",
    tag: "zen",
  },
  {
    id: "trivial",
    title: "Trivial de cabina",
    blurb: "Ocho preguntas. Todos responden a la vez. Cultura general para el rato.",
    tag: "saber",
  },
  {
    id: "mentiroso",
    title: "Mentiroso",
    blurb: "Tirás cartas boca abajo y decís un palo. ¿Te creen?",
    tag: "farol",
  },
];

export function gameTitle(id: GameId): string {
  switch (id) {
    case "basta":
      return "Basta";
    case "dibujo":
      return "Ventanilla";
    case "bomba":
      return "Sílabomba";
    case "mente":
      return "La Mente";
    case "trivial":
      return "Trivial de cabina";
    case "mentiroso":
      return "Mentiroso";
    default:
      return assertNever(id);
  }
}

export function initGame(id: GameId, seed: number, players: Player[]): unknown {
  switch (id) {
    case "basta":
      return initBasta(seed, players);
    case "dibujo":
      return initDibujo(seed, players);
    case "bomba":
      return initBomba(seed, players);
    case "mente":
      return initMente(seed, players);
    case "trivial":
      return initTrivial(seed, players);
    case "mentiroso":
      return initMentiroso(seed, players);
    default:
      return assertNever(id);
  }
}

export function reduceGame(
  id: GameId,
  state: unknown,
  action: unknown,
  from: string,
  players: Player[],
): unknown {
  if (!state || typeof action !== "object" || action === null || !("type" in action)) {
    return state;
  }
  switch (id) {
    case "basta":
      return reduceBasta(state as BastaState, action as BastaAction, from, players);
    case "dibujo":
      return reduceDibujo(state as DibujoState, action as DibujoAction, from, players);
    case "bomba":
      return reduceBomba(state as BombaState, action as BombaAction, from, players);
    case "mente":
      return reduceMente(state as MenteState, action as MenteAction, from, players);
    case "trivial":
      return reduceTrivial(state as TrivialState, action as TrivialAction, from, players);
    case "mentiroso":
      return reduceMentiroso(
        state as MentirosoState,
        action as MentirosoAction,
        from,
        players,
      );
    default:
      return assertNever(id);
  }
}
