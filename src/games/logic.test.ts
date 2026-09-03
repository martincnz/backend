import { describe, expect, it } from "vitest";
import { initBasta, reduceBasta, scoreBastaRound, type BastaAnswers } from "./basta/logic";
import { initMente, lowestRemaining, reduceMente } from "./mente/logic";
import { initMentiroso, reduceMentiroso } from "./mentiroso/logic";
import { initBomba, reduceBomba } from "./bomba/logic";
import { initTrivial, reduceTrivial } from "./trivial/logic";
import { QUESTIONS } from "./trivial/data";
import { injectLanCandidates } from "../net/ice";
import { packSignal, unpackSignal } from "../net/compress";
import type { Player } from "../types";

const players: Player[] = [
  { id: "a", name: "Sofi", seat: "17A" },
  { id: "b", name: "Martin", seat: "17B" },
  { id: "c", name: "Lucho", seat: "17C" },
];

describe("basta scoring", () => {
  it("gives 10 to unique words and 5 to shared ones", () => {
    const answers: Record<string, BastaAnswers> = {
      a: {
        nombre: "Ana",
        apellido: "Alvarez",
        ciudad: "Asunción",
        animal: "Avestruz",
        color: "Azul",
        cosa: "Anillo",
      },
      b: {
        nombre: "Ana",
        apellido: "Borges",
        ciudad: "Asunción",
        animal: "Abeja",
        color: "Amarillo",
        cosa: "Arpa",
      },
      c: {
        nombre: "",
        apellido: "",
        ciudad: "",
        animal: "",
        color: "",
        cosa: "",
      },
    };
    const points = scoreBastaRound(answers, "A", ["a", "b", "c"]);
    expect(points.c).toBe(0);
    expect(points.a).toBe(50);
    expect(points.b).toBe(40);
  });

  it("plays a round to reveal", () => {
    let state = initBasta(1, players);
    state = reduceBasta(state, { type: "begin" }, "a", players);
    expect(state.phase).toBe("write");
    expect(state.letter).toMatch(/^[A-Z]$/);
    const empty = {
      nombre: "ada",
      apellido: "ada",
      ciudad: "ada",
      animal: "ada",
      color: "ada",
      cosa: "ada",
    };
    state = reduceBasta(state, { type: "submit", answers: empty }, "a", players);
    state = reduceBasta(state, { type: "basta", answers: empty }, "b", players);
    expect(state.phase === "reveal" || state.phase === "match").toBe(true);
  });
});

describe("la mente", () => {
  it("loses a life when someone plays before a lower card", () => {
    let state = initMente(7, players);
    const expected = lowestRemaining(state.hands);
    const offender = Object.entries(state.hands).find(([, cards]) => cards[0] !== expected);
    if (!offender) throw new Error("all lowest cards are tied; unlucky seed");
    const before = state.lives;
    state = reduceMente(state, { type: "play" }, offender[0], players);
    expect(state.lives).toBe(before - 1);
  });
});

describe("mentiroso", () => {
  it("gives the pile to the liar when called out", () => {
    let state = initMentiroso(3, players);
    const hand = state.hands.a ?? [];
    const card = hand[0];
    if (!card) throw new Error("no card");
    const lieRank = card.rank === "A" ? "K" : "A";
    state = reduceMentiroso(
      state,
      { type: "play", cardIds: [card.id], rank: lieRank },
      "a",
      players,
    );
    expect(state.phase).toBe("call");
    state = reduceMentiroso(state, { type: "lie" }, "b", players);
    expect(state.lastTruth).toBe(false);
    expect(state.hands.a?.length).toBeGreaterThan(hand.length - 1);
  });
});

describe("bomba", () => {
  it("accepts a word with the syllable and rejects duplicates", () => {
    let state = initBomba(4, players);
    const word = `${state.syllable}casa`;
    state = reduceBomba(state, { type: "word", text: word }, "a", players);
    expect(state.used.length).toBe(1);
    expect(state.currentId).toBe("b");
    const again = reduceBomba(state, { type: "word", text: word }, "b", players);
    expect(again.used.length).toBe(1);
  });

  it("timeout only applies to the matching turn", () => {
    const state = initBomba(4, players);
    const ignored = reduceBomba(state, { type: "timeout", turn: 99 }, "a", players);
    expect(ignored.lives.a).toBe(2);
    const hit = reduceBomba(state, { type: "timeout", turn: 0 }, "a", players);
    expect(hit.lives.a).toBe(1);
  });
});

describe("trivial", () => {
  it("scores only after everyone answers", () => {
    let state = initTrivial(9, players);
    const q = QUESTIONS[state.order[0] ?? 0];
    if (!q) throw new Error("no q");
    state = reduceTrivial(state, { type: "answer", choice: q.ok }, "a", players);
    expect(state.phase).toBe("ask");
    state = reduceTrivial(state, { type: "answer", choice: q.ok }, "b", players);
    state = reduceTrivial(state, { type: "answer", choice: (q.ok + 1) % 4 }, "c", players);
    expect(state.phase).toBe("reveal");
    expect(state.scores.a).toBe(1);
    expect(state.scores.b).toBe(1);
    expect(state.scores.c).toBe(0);
  });
});

describe("ice + compress", () => {
  it("injects hotspot IPs next to .local candidates", () => {
    const sdp = [
      "v=0",
      "a=candidate:1 1 udp 1 abcdef.local 4444 typ host",
      "a=end-of-candidates",
    ].join("\r\n");
    const out = injectLanCandidates(sdp, ["192.168.43.1"]);
    expect(out).toContain("192.168.43.1");
    expect(out).toContain("172.20.10.1");
  });

  it("roundtrips a signal payload", async () => {
    const payload = { v: 1, kind: "offer", sdp: "v=0\r\no=- 1 1 IN IP4 0.0.0.0" };
    const packed = await packSignal(payload);
    const back = await unpackSignal<typeof payload>(packed);
    expect(back.sdp).toBe(payload.sdp);
  });
});
