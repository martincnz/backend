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
  initGarticphone,
  reduceGarticphone,
  type GarticPhoneAction,
  type GarticPhoneState,
} from "./garticphone/logic";
import {
  initTemblor,
  reduceTemblor,
  type TemblorAction,
  type TemblorState,
} from "./temblor/logic";
import { initPiloto, reducePiloto, type PilotoAction, type PilotoState } from "./piloto/logic";
import { initTurbo, reduceTurbo, type TurboAction, type TurboState } from "./turbo/logic";
import { initEco, reduceEco, type EcoAction, type EcoState } from "./eco/logic";
import { initTaboo, reduceTaboo, type TabooAction, type TabooState } from "./taboo/logic";
import { initAdinvina, reduceAdinvina, type AdinvinaAction, type AdinvinaState } from "./adivina/logic";
import type { GameOpts } from "./shared";

export type AnyGameState =
  | CinturonState
  | DibujoState
  | GarticPhoneState
  | TemblorState
  | PilotoState
  | TurboState
  | EcoState
  | TabooState
  | AdinvinaState;

export const GAMES: Array<{
  id: GameId;
  title: string;
  blurb: string;
  tag: string;
}> = [
  {
    id: "dibujo",
    title: "Pinturillo",
    blurb: "Uno dibuja y los otros adivinan la palabra (verificación automática).",
    tag: "dibujo",
  },
  {
    id: "garticphone",
    title: "Gartic Phone",
    blurb: "Teléfono descompuesto con dibujos. Dibujás en cadena y el motor valida con opciones.",
    tag: "cadena",
  },
  {
    id: "taboo",
    title: "Taboo",
    blurb: "Elegí 3 claves y no toques palabras prohibidas. La verificación es automática.",
    tag: "pistas",
  },
  {
    id: "adivina",
    title: "Adivina",
    blurb: "Quiz de famoso/objeto/categoría con opciones. El motor sabe la respuesta.",
    tag: "quiz",
  },
];

export function gameTitle(id: GameId): string {
  switch (id) {
    case "cinturon":
      return "Cinturón";
    case "dibujo":
      return "Pinturillo";
    case "garticphone":
      return "Gartic Phone";
    case "taboo":
      return "Taboo";
    case "adivina":
      return "Adivina";
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
    case "garticphone":
      return initGarticphone(seed, players);
    case "temblor":
      return initTemblor(seed, players, solo);
    case "piloto":
      return initPiloto(seed, players, solo);
    case "turbo":
      return initTurbo(seed, players, solo);
    case "eco":
      return initEco(seed, players, solo);
    case "taboo":
      return initTaboo(seed, players);
    case "adivina":
      return initAdinvina(seed, players);
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
    case "garticphone":
      return reduceGarticphone(
        state as GarticPhoneState,
        action as GarticPhoneAction,
        from,
        players,
      );
    case "temblor":
      return reduceTemblor(state as TemblorState, action as TemblorAction, from, players);
    case "piloto":
      return reducePiloto(state as PilotoState, action as PilotoAction, from, players);
    case "turbo":
      return reduceTurbo(state as TurboState, action as TurboAction, from, players);
    case "eco":
      return reduceEco(state as EcoState, action as EcoAction, from, players);
    case "taboo":
      return reduceTaboo(state as TabooState, action as TabooAction, from, players);
    case "adivina":
      return reduceAdinvina(state as AdinvinaState, action as AdinvinaAction, from, players);
    default:
      return assertNever(id);
  }
}

export function turnPlayerId(id: GameId, state: unknown): string | null {
  if (!state || typeof state !== "object") return null;
  switch (id) {
    case "dibujo":
      return (state as DibujoState).drawerId;
    case "garticphone": {
      const s = state as GarticPhoneState;
      return s.phase === "draw" ? s.drawerId : null;
    }
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
    case "taboo": {
      const s = state as TabooState;
      return s.phase === "clues" ? s.describerId : null;
    }
    case "adivina":
      return null;
    default:
      return assertNever(id);
  }
}

export function needsPassCover(id: GameId): boolean {
  switch (id) {
    case "dibujo":
      return true;
    case "garticphone":
      return true;
    case "taboo":
      return true;
    case "adivina":
      return false;
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
