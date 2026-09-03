export const HOTSPOT_IPS = [
  "192.168.43.1",
  "192.168.49.1",
  "192.168.137.1",
  "172.20.10.1",
  "192.168.0.1",
  "192.168.1.1",
  "10.0.0.1",
];

function isLocalName(address: string): boolean {
  return address.endsWith(".local") || address.includes("%");
}

function candidateLine(base: string, address: string): string {
  const parts = base.split(" ");
  if (parts.length < 5) return base;
  parts[4] = address;
  return parts.join(" ");
}

export function injectLanCandidates(sdp: string, extraIps: string[] = []): string {
  const ips = [...new Set([...extraIps.filter(Boolean), ...HOTSPOT_IPS])];
  const lines = sdp.split(/\r?\n/);
  const extras: string[] = [];
  for (const line of lines) {
    if (!line.startsWith("a=candidate:")) continue;
    const parts = line.split(" ");
    if (parts.length < 8) continue;
    const address = parts[4] ?? "";
    const typ = parts[7] ?? "";
    if (typ !== "host") continue;
    if (!isLocalName(address) && !address.includes(":")) continue;
    for (const ip of ips) {
      extras.push(candidateLine(line, ip));
    }
  }
  if (extras.length === 0) return sdp;
  const idx = lines.findIndex((l) => l.startsWith("a=end-of-candidates"));
  if (idx >= 0) {
    lines.splice(idx, 0, ...extras);
  } else {
    lines.push(...extras);
  }
  return lines.join("\r\n");
}

export function waitForIce(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      pc.removeEventListener("icegatheringstatechange", onChange);
      resolve();
    };
    const onChange = () => {
      if (pc.iceGatheringState === "complete") done();
    };
    pc.addEventListener("icegatheringstatechange", onChange);
    setTimeout(done, 2500);
  });
}

export const LAN_RTC_CONFIG: RTCConfiguration = {
  iceServers: [],
  iceCandidatePoolSize: 0,
  iceTransportPolicy: "all",
};
