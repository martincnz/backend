import type { GameId, Player } from "../types";
import { assertNever } from "../types";
import {
  initCinturon,
  reduceCinturon,
  type CinturonAction,
  type CinturonState,
} from "./cinturon/logic";
import { initDibujo, reduceDibujo, type DibujoAction, type DibujoState } from "./dibujo/logic";
import {
  initTemblor,
  reduceTemblor,
  type TemblorAction,
  type TemblorState,
} from "./temblor/logic";
import { initPiloto, reducePiloto, type PilotoAction, type PilotoState } from "./piloto/logic";
import { initTurbo, reduceTurbo, type TurboAction, type TurboState } from "./turbo/logic";
import { initEco, reduceEco, type EcoAction, type EcoState } from "./eco/logic";
import type { GameOpts } from "./shared";

export type AnyGameState =
  | CinturonState
  | DibujoState
  | TemblorState
  | PilotoState
  | TurboState
  | EcoState;

export const GAMES: Array<{
  id: GameId;
  title: string;
  blurb: string;
  tag: string;
}> = [
  {
    id: "cinturon",
    title: "Cinturón",
    blurb: "Esperá. Cuando el celu dice YA, tocá. Si te apurás, falta. El reloj decide.",
    tag: "reacción",
  },
  {
    id: "dibujo",
    title: "Ventanilla",
    blurb: "Uno dibuja, los otros adivinan. El único con lápiz.",
    tag: "lápiz",
  },
  {
    id: "temblor",
    title: "Temblor",
    blurb: "Ocho segundos. Sacudí el teléfono. El acelerómetro suma, no tu palabra.",
    tag: "sensor",
  },
  {
    id: "piloto",
    title: "Piloto",
    blurb: "Incliná el celular y mantené el avión en verde. El giroscopio es el juez.",
    tag: "sensor",
  },
  {
    id: "turbo",
    title: "Turbo",
    blurb: "Machacá la pantalla. El teléfono cuenta cada toque.",
    tag: "toques",
  },
  {
    id: "eco",
    title: "Eco",
    blurb: "El celu muestra y vibra una secuencia. Repetila. Si te equivocás, cortó.",
    tag: "memoria",
  },
];

export function gameTitle(id: GameId): string {
  switch (id) {
    case "cinturon":
      return "Cinturón";
    case "dibujo":
      return "Ventanilla";
    case "temblor":
      return "Temblor";
    case "piloto":
      return "Piloto";
    case "turbo":
      return "Turbo";
    case "eco":
      return "Eco";
    default:
      return assertNever(id);
  }
}

export function initGame(
  id: GameId,
  seed: number,
  players: Player[],
  opts: GameOpts = {},
): unknown {
  const solo = Boolean(opts.solo);
  switch (id) {
    case "cinturon":
      return initCinturon(seed, players, solo);
    case "dibujo":
      return initDibujo(seed, players);
    case "temblor":
      return initTemblor(seed, players, solo);
    case "piloto":
      return initPiloto(seed, players, solo);
    case "turbo":
      return initTurbo(seed, players, solo);
    case "eco":
      return initEco(seed, players, solo);
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
    case "cinturon":
      return reduceCinturon(state as CinturonState, action as CinturonAction, from, players);
    case "dibujo":
      return reduceDibujo(state as DibujoState, action as DibujoAction, from, players);
    case "temblor":
      return reduceTemblor(state as TemblorState, action as TemblorAction, from, players);
    case "piloto":
      return reducePiloto(state as PilotoState, action as PilotoAction, from, players);
    case "turbo":
      return reduceTurbo(state as TurboState, action as TurboAction, from, players);
    case "eco":
      return reduceEco(state as EcoState, action as EcoAction, from, players);
    default:
      return assertNever(id);
  }
}

export function turnPlayerId(id: GameId, state: unknown): string | null {
  if (!state || typeof state !== "object") return null;
  switch (id) {
    case "dibujo":
      return (state as DibujoState).drawerId;
    case "cinturon": {
      const current = state as CinturonState;
      return current.solo ? current.currentId : null;
    }
    case "temblor": {
      const current = state as TemblorState;
      return current.solo ? current.currentId : null;
    }
    case "piloto": {
      const current = state as PilotoState;
      return current.solo ? current.currentId : null;
    }
    case "turbo": {
      const current = state as TurboState;
      return current.solo ? current.currentId : null;
    }
    case "eco": {
      const current = state as EcoState;
      return current.solo ? current.currentId : null;
    }
    default:
      return assertNever(id);
  }
}

export function needsPassCover(id: GameId): boolean {
  switch (id) {
    case "dibujo":
      return true;
    case "cinturon":
    case "temblor":
    case "piloto":
    case "turbo":
    case "eco":
      return false;
    default:
      return assertNever(id);
  }
}
