import { injectLanCandidates, LAN_RTC_CONFIG, waitForIce } from "./ice";
import { packSignal, unpackSignal } from "./compress";
import type { SignalPayload, WireMsg } from "../types";

export type WireHandler = (msg: WireMsg) => void;

function parseJson(raw: string): WireMsg | null {
  try {
    return JSON.parse(raw) as WireMsg;
  } catch {
    return null;
  }
}

export class DataLink {
  readonly pc: RTCPeerConnection;
  readonly channel: RTCDataChannel;

  constructor(pc: RTCPeerConnection, channel: RTCDataChannel) {
    this.pc = pc;
    this.channel = channel;
  }

  send(msg: WireMsg): void {
    if (this.channel.readyState !== "open") return;
    this.channel.send(JSON.stringify(msg));
  }

  get open(): boolean {
    return this.channel.readyState === "open";
  }

  close(): void {
    try {
      this.channel.close();
    } catch {
      /* already closed */
    }
    this.pc.close();
  }
}

function bindChannel(
  link: DataLink,
  onMessage: WireHandler,
  onOpen: (link: DataLink) => void,
  onClose: () => void,
): void {
  link.channel.onmessage = (ev) => {
    const msg = parseJson(String(ev.data));
    if (msg) onMessage(msg);
  };
  link.channel.onopen = () => onOpen(link);
  link.channel.onclose = onClose;
  link.pc.onconnectionstatechange = () => {
    if (
      link.pc.connectionState === "failed" ||
      link.pc.connectionState === "closed" ||
      link.pc.connectionState === "disconnected"
    ) {
      onClose();
    }
  };
}

async function localSdp(pc: RTCPeerConnection, extraIps: string[]): Promise<string> {
  await waitForIce(pc);
  const sdp = pc.localDescription?.sdp;
  if (!sdp) throw new Error("No hay SDP local");
  return injectLanCandidates(sdp, extraIps);
}

export async function createHostOffer(
  slot: 1 | 2,
  hostName: string,
  extraIps: string[],
  onMessage: WireHandler,
  onOpen: (link: DataLink) => void,
  onClose: () => void,
): Promise<{ link: DataLink; code: string }> {
  const pc = new RTCPeerConnection(LAN_RTC_CONFIG);
  const channel = pc.createDataChannel("cabina", { ordered: true });
  const link = new DataLink(pc, channel);
  bindChannel(link, onMessage, onOpen, onClose);
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  const sdp = await localSdp(pc, extraIps);
  const payload: SignalPayload = {
    v: 1,
    kind: "offer",
    slot,
    name: hostName,
    sdp,
    hostIp: extraIps[0],
  };
  return { link, code: await packSignal(payload) };
}

export async function acceptHostAnswer(link: DataLink, code: string): Promise<SignalPayload> {
  const payload = await unpackSignal<SignalPayload>(code);
  if (payload.kind !== "answer") throw new Error("Ese código no es una respuesta");
  await link.pc.setRemoteDescription({ type: "answer", sdp: payload.sdp });
  return payload;
}

export async function answerHostOffer(
  code: string,
  guestName: string,
  extraIps: string[],
  onMessage: WireHandler,
  onOpen: (link: DataLink) => void,
  onClose: () => void,
): Promise<{ answerCode: string; offer: SignalPayload; pc: RTCPeerConnection }> {
  const offer = await unpackSignal<SignalPayload>(code);
  if (offer.kind !== "offer") throw new Error("Ese código no es una cabina");
  const extra = extraIps.length > 0 ? extraIps : offer.hostIp ? [offer.hostIp] : [];
  const pc = new RTCPeerConnection(LAN_RTC_CONFIG);
  pc.ondatachannel = (ev) => {
    bindChannel(new DataLink(pc, ev.channel), onMessage, onOpen, onClose);
  };
  await pc.setRemoteDescription({ type: "offer", sdp: offer.sdp });
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  const sdp = await localSdp(pc, extra);
  const payload: SignalPayload = {
    v: 1,
    kind: "answer",
    slot: offer.slot,
    name: guestName,
    sdp,
  };
  return { answerCode: await packSignal(payload), offer, pc };
}
