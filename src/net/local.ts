import type { Player, WireMsg } from "../types";
import { SEATS } from "../types";

export type MeshHandler = (from: string, msg: WireMsg) => void;

/** In-memory star topology so 3 "phones" can play in one browser. */
export class LocalStar {
  private host: MeshHandler | null = null;
  private readonly guests = new Map<string, MeshHandler>();

  registerHost(handler: MeshHandler): () => void {
    this.host = handler;
    return () => {
      if (this.host === handler) this.host = null;
    };
  }

  registerGuest(id: string, handler: MeshHandler): () => void {
    this.guests.set(id, handler);
    return () => {
      this.guests.delete(id);
    };
  }

  toHost(from: string, msg: WireMsg): void {
    this.host?.(from, msg);
  }

  toGuest(id: string, msg: WireMsg): void {
    this.guests.get(id)?.("host", msg);
  }

  toGuests(msg: WireMsg, except?: string): void {
    for (const [id, handler] of this.guests) {
      if (id === except) continue;
      handler("host", msg);
    }
  }
}

export function seatForIndex(index: number): Player["seat"] {
  return SEATS[index] ?? "17A";
}
