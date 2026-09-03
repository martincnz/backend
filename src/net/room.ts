import type { GameId, Player, WireMsg } from "../types";
import { SEATS } from "../types";
import type { DataLink } from "./webrtc";
import type { LocalStar } from "./local";

export type RoomListener = () => void;

export type RoomSnapshot = {
  role: "host" | "guest";
  self: Player;
  players: Player[];
  selected: GameId | null;
  game: GameId | null;
  seed: number;
  state: unknown;
  chat: Array<{ from: string; text: string }>;
  connected: number;
  error: string | null;
};

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export class GameRoom {
  readonly self: Player;
  readonly role: "host" | "guest";
  players: Player[];
  selected: GameId | null = null;
  game: GameId | null = null;
  seed = 0;
  state: unknown = null;
  chat: Array<{ from: string; text: string }> = [];
  error: string | null = null;
  private readonly listeners = new Set<RoomListener>();
  private readonly links = new Map<string, DataLink>();
  private star: LocalStar | null = null;
  private applyAction: ((state: unknown, action: unknown, from: string) => unknown) | null =
    null;

  constructor(role: "host" | "guest", name: string, seatIndex = 0, id = uid()) {
    this.role = role;
    this.self = {
      id,
      name: name.trim().slice(0, 12) || (role === "host" ? "Ventana" : "Pasillo"),
      seat: SEATS[seatIndex] ?? "17A",
    };
    this.players = role === "host" ? [this.self] : [];
  }

  get connected(): number {
    if (this.star) return this.players.length;
    return this.role === "host" ? this.links.size + 1 : this.players.length;
  }

  snapshot(): RoomSnapshot {
    return {
      role: this.role,
      self: this.self,
      players: this.players,
      selected: this.selected,
      game: this.game,
      seed: this.seed,
      state: this.state,
      chat: this.chat,
      connected: this.connected,
      error: this.error,
    };
  }

  subscribe(fn: RoomListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  attachEngine(
    apply: (state: unknown, action: unknown, from: string) => unknown,
  ): void {
    this.applyAction = apply;
  }

  attachLink(playerId: string, link: DataLink): void {
    this.links.set(playerId, link);
    this.emit();
  }

  dropLink(playerId: string): void {
    const link = this.links.get(playerId);
    link?.close();
    this.links.delete(playerId);
    this.players = this.players.filter((p) => p.id !== playerId);
    this.emit();
    this.broadcast({ t: "lobby", players: this.players });
  }

  attachStar(star: LocalStar): void {
    this.star = star;
    if (this.role === "host") {
      star.registerHost((_from, msg) => this.handle(msg));
    } else {
      star.registerGuest(this.self.id, (_from, msg) => this.handle(msg));
    }
  }

  addLocalPlayer(name: string, seatIndex: number): Player {
    const player: Player = {
      id: uid(),
      name: name.trim().slice(0, 12) || `Asiento ${seatIndex + 1}`,
      seat: SEATS[seatIndex] ?? "17A",
    };
    this.players = [...this.players, player];
    this.emit();
    return player;
  }

  localJoin(player: Player): void {
    if (this.role !== "host") return;
    if (!this.players.some((p) => p.id === player.id)) {
      this.players = [...this.players, player];
    }
    this.star?.toGuest(player.id, {
      t: "welcome",
      self: player,
      players: this.players,
    });
    this.broadcast({ t: "lobby", players: this.players });
    this.emit();
  }

  handle(msg: WireMsg): void {
    switch (msg.t) {
      case "hello":
        if (this.role !== "host") return;
        if (!this.players.some((p) => p.id === msg.player.id)) {
          const seat = this.players.length < 3 ? SEATS[this.players.length] : "17C";
          const player = { ...msg.player, seat };
          this.players = [...this.players, player];
          this.sendTo(player.id, { t: "welcome", self: player, players: this.players });
          this.broadcast({ t: "lobby", players: this.players });
        }
        this.emit();
        return;
      case "welcome":
        this.players = msg.players;
        this.self.seat = msg.self.seat;
        this.self.id = msg.self.id;
        this.emit();
        return;
      case "lobby":
        this.players = msg.players;
        this.emit();
        return;
      case "chat":
        this.chat = [...this.chat, { from: msg.from, text: msg.text }].slice(-40);
        if (this.role === "host") this.broadcast(msg);
        this.emit();
        return;
      case "select":
        this.selected = msg.game;
        if (msg.game === null) {
          this.game = null;
          this.state = null;
        }
        if (this.role === "host") this.broadcast(msg);
        this.emit();
        return;
      case "start":
        this.game = msg.game;
        this.seed = msg.seed;
        this.state = null;
        if (this.role === "host") this.broadcast(msg);
        this.emit();
        return;
      case "action":
        if (this.role === "host") {
          this.dispatch(msg.action, msg.from);
        }
        return;
      case "state":
        this.game = msg.game;
        this.state = msg.state;
        this.emit();
        return;
      case "delta":
        if (this.role !== "host") {
          this.state = this.applyAction?.(this.state, msg.action, msg.from) ?? this.state;
          this.emit();
        }
        return;
      case "ping":
        this.sendRaw({ t: "pong", at: msg.at });
        return;
      case "pong":
        return;
      case "error":
        this.error = msg.message;
        this.emit();
        return;
      default: {
        const _n: never = msg;
        void _n;
      }
    }
  }

  dispatch(action: unknown, from = this.self.id): void {
    if (this.role !== "host" || !this.game) return;
    const isDelta =
      typeof action === "object" &&
      action !== null &&
      "type" in action &&
      (action as { type: string }).type === "stroke";
    const next = this.applyAction?.(this.state, action, from) ?? this.state;
    this.state = next;
    if (isDelta) {
      this.broadcast({ t: "delta", from, action });
    } else {
      this.broadcast({ t: "state", game: this.game, state: next });
    }
    this.emit();
  }

  sendAction(action: unknown, asId = this.self.id): void {
    if (this.role === "host") {
      this.dispatch(action, asId);
      return;
    }
    this.sendRaw({ t: "action", from: asId, action });
  }

  startGame(game: GameId, seed = Date.now(), initial: unknown): void {
    if (this.role !== "host") {
      this.sendRaw({ t: "action", from: this.self.id, action: { type: "request-start", game } });
      return;
    }
    this.game = game;
    this.seed = seed;
    this.state = initial;
    this.broadcast({ t: "start", game, seed });
    this.broadcast({ t: "state", game, state: initial });
    this.emit();
  }

  selectGame(game: GameId | null): void {
    this.selected = game;
    if (this.role === "host") this.broadcast({ t: "select", game });
    else this.sendRaw({ t: "select", game });
    this.emit();
  }

  sendChat(text: string): void {
    const msg: WireMsg = { t: "chat", from: this.self.id, text };
    if (this.role === "host") {
      this.handle(msg);
    } else {
      this.sendRaw(msg);
    }
  }

  hello(): void {
    this.sendRaw({ t: "hello", player: this.self });
  }

  leaveGame(): void {
    if (this.role !== "host") return;
    this.game = null;
    this.state = null;
    this.selected = null;
    this.broadcast({ t: "select", game: null });
    this.emit();
  }

  private sendTo(playerId: string, msg: WireMsg): void {
    if (this.star) {
      this.star.toGuest(playerId, msg);
      return;
    }
    this.links.get(playerId)?.send(msg);
  }

  private sendRaw(msg: WireMsg): void {
    if (this.star) {
      if (this.role === "host") this.star.toGuests(msg);
      else this.star.toHost(this.self.id, msg);
      return;
    }
    if (this.role === "host") {
      for (const link of this.links.values()) link.send(msg);
      return;
    }
    for (const link of this.links.values()) link.send(msg);
  }

  broadcast(msg: WireMsg): void {
    if (this.role !== "host") return;
    this.sendRaw(msg);
  }
}
