const alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function bytesToB64url(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const triple = (a << 16) | (b << 8) | c;
    out += alphabet[(triple >> 18) & 63];
    out += alphabet[(triple >> 12) & 63];
    out += i + 1 < bytes.length ? alphabet[(triple >> 6) & 63] : "";
    out += i + 2 < bytes.length ? alphabet[triple & 63] : "";
  }
  return out;
}

function b64urlToBytes(text: string): Uint8Array {
  const clean = text.replace(/[^A-Za-z0-9\-_]/g, "");
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const n = [
      alphabet.indexOf(clean[i] ?? "A"),
      alphabet.indexOf(clean[i + 1] ?? "A"),
      alphabet.indexOf(clean[i + 2] ?? "A"),
      alphabet.indexOf(clean[i + 3] ?? "A"),
    ].map((v) => (v < 0 ? 0 : v));
    const triple = (n[0] << 18) | (n[1] << 12) | (n[2] << 6) | n[3];
    if (o < out.length) out[o++] = (triple >> 16) & 255;
    if (o < out.length) out[o++] = (triple >> 8) & 255;
    if (o < out.length) out[o++] = triple & 255;
  }
  return out;
}

function toStream(bytes: Uint8Array): ReadableStream {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream === "undefined") return bytes;
  const stream = toStream(bytes).pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function inflate(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") return bytes;
  const stream = toStream(bytes).pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function packSignal(payload: unknown): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(payload));
  const compressed = await deflate(json);
  const usedDeflate = compressed.length < json.length;
  const body = usedDeflate ? compressed : json;
  return `${usedDeflate ? "1" : "0"}${bytesToB64url(body)}`;
}

export async function unpackSignal<T>(code: string): Promise<T> {
  const trimmed = code.trim().replace(/\s+/g, "");
  const flag = trimmed[0];
  const body = b64urlToBytes(trimmed.slice(1));
  const jsonBytes = flag === "1" ? await inflate(body) : body;
  return JSON.parse(new TextDecoder().decode(jsonBytes)) as T;
}
