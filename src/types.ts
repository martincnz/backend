export const SEATS = ["17A", "17B", "17C"] as const;
export type Seat = (typeof SEATS)[number];

export type GameId =
  | "basta"
  | "dibujo"
  | "bomba"
  | "mente"
  | "trivial"
  | "mentiroso";

export type Player = {
  id: string;
  name: string;
  seat: Seat;
};

export type SignalPayload = {
  v: 1;
  kind: "offer" | "answer";
  slot: 1 | 2;
  name: string;
  sdp: string;
  hostIp?: string;
};

export type WireMsg =
  | { t: "hello"; player: Player }
  | { t: "welcome"; self: Player; players: Player[] }
  | { t: "lobby"; players: Player[] }
  | { t: "chat"; from: string; text: string }
  | { t: "select"; game: GameId | null }
  | { t: "start"; game: GameId; seed: number }
  | { t: "action"; from: string; action: unknown }
  | { t: "state"; game: GameId; state: unknown }
  | { t: "delta"; from: string; action: unknown }
  | { t: "ping"; at: number }
  | { t: "pong"; at: number }
  | { t: "error"; message: string };

export function assertNever(value: never, message = "unexpected"): never {
  throw new Error(`${message}: ${String(value)}`);
}
