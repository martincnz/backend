import { describe, expect, it } from "vitest";
import { initCinturon, reduceCinturon } from "./cinturon/logic";
import { initTemblor, reduceTemblor } from "./temblor/logic";
import { initPiloto, reducePiloto } from "./piloto/logic";
import { initTurbo, reduceTurbo } from "./turbo/logic";
import { initEco, reduceEco } from "./eco/logic";
import { FALSE_START } from "./shared";
import { injectLanCandidates } from "../net/ice";
import { packSignal, unpackSignal } from "../net/compress";
import type { Player } from "../types";

const players: Player[] = [
  { id: "a", name: "Sofi", seat: "17A" },
  { id: "b", name: "Martin", seat: "17B" },
  { id: "c", name: "Lucho", seat: "17C" },
];

describe("cinturón", () => {
  it("marks a tap before GO as a false start", () => {
    let state = initCinturon(1, players, true);
    state = reduceCinturon(state, { type: "ready" }, "a", players);
    expect(state.phase).toBe("wait");
    state = reduceCinturon(state, { type: "tap", at: 10 }, "a", players);
    expect(state.times.a).toBe(FALSE_START);
    expect(state.phase).toBe("result");
  });

  it("records host-clock reaction and awards the fastest", () => {
    let state = initCinturon(2, players, false);
    state = reduceCinturon(state, { type: "ready" }, "a", players);
    state = reduceCinturon(state, { type: "ready" }, "b", players);
    state = reduceCinturon(state, { type: "ready" }, "c", players);
    state = reduceCinturon(state, { type: "go", at: 1000 }, "a", players);
    state = reduceCinturon(state, { type: "tap", at: 1180 }, "b", players);
    state = reduceCinturon(state, { type: "tap", at: 1110 }, "a", players);
    state = reduceCinturon(state, { type: "tap", at: 1400 }, "c", players);
    expect(state.times.a).toBe(110);
    expect(state.scores.a).toBe(1);
    expect(state.scores.b).toBe(0);
    expect(state.scores.c).toBe(0);
  });
});

describe("temblor", () => {
  it("keeps the highest energy and awards the shakiest phone", () => {
    let state = initTemblor(3, players, false);
    state = reduceTemblor(state, { type: "start", at: 0 }, "a", players);
    state = reduceTemblor(state, { type: "tick", energy: 12 }, "a", players);
    state = reduceTemblor(state, { type: "tick", energy: 40 }, "b", players);
    state = reduceTemblor(state, { type: "done", energy: 18 }, "a", players);
    state = reduceTemblor(state, { type: "done", energy: 40 }, "b", players);
    state = reduceTemblor(state, { type: "done", energy: 9 }, "c", players);
    expect(state.energy.b).toBe(40);
    expect(state.scores.b).toBe(1);
  });
});

describe("piloto", () => {
  it("awards the longest time in the green corridor", () => {
    let state = initPiloto(4, players, false);
    state = reducePiloto(state, { type: "start", at: 0 }, "a", players);
    state = reducePiloto(state, { type: "done", greenMs: 1200 }, "a", players);
    state = reducePiloto(state, { type: "done", greenMs: 5100 }, "c", players);
    state = reducePiloto(state, { type: "done", greenMs: 3000 }, "b", players);
    expect(state.scores.c).toBe(1);
    expect(state.greenMs.c).toBe(5100);
  });
});

describe("turbo", () => {
  it("counts taps and awards the highest score after timeout", () => {
    let state = initTurbo(5, players, true);
    state = reduceTurbo(state, { type: "start", at: 0 }, "a", players);
    state = reduceTurbo(state, { type: "tap" }, "a", players);
    state = reduceTurbo(state, { type: "tap" }, "a", players);
    state = reduceTurbo(state, { type: "tap" }, "a", players);
    expect(state.taps.a).toBe(3);
    state = reduceTurbo(state, { type: "timeout" }, "a", players);
    expect(state.phase).toBe("result");
    state = reduceTurbo(state, { type: "next" }, "a", players);
    expect(state.currentId).toBe("b");
  });
});

describe("eco", () => {
  it("rejects a wrong pad and accepts a matching sequence", () => {
    let state = initEco(6, players, true);
    const first = state.sequence[0];
    if (first === undefined) throw new Error("empty sequence");
    const wrong = (first + 1) % 4;
    const failed = reduceEco(state, { type: "press", pad: wrong }, "a", players);
    expect(failed.progress.a?.dead).toBe(true);
    expect(failed.progress.a?.score).toBe(0);

    let ok = reduceEco(state, { type: "press", pad: first }, "a", players);
    expect(ok.progress.a?.dead).toBe(false);
    expect(ok.progress.a?.score).toBe(1);
    expect(ok.progress.a?.level).toBe(2);
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
