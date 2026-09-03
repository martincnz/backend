import { useRef, useState } from "react";
import {
  acceptHostAnswer,
  createHostOffer,
  type DataLink,
} from "../net/webrtc";
import { GameRoom } from "../net/room";
import { Button, Field, Panel } from "./kit";
import { QrCard, QrScanner } from "./Qr";

type SlotStatus = "idle" | "offer" | "scan" | "up";

export function HostSetup({
  onReady,
  onBack,
}: {
  onReady: (room: GameRoom) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("Ventana");
  const [ip, setIp] = useState("");
  const [room] = useState(() => new GameRoom("host", "Ventana", 0));
  const [slot, setSlot] = useState<1 | 2>(1);
  const [status, setStatus] = useState<SlotStatus>("idle");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(1);
  const linkRef = useRef<DataLink | null>(null);

  const extras = ip.trim() ? [ip.trim()] : [];

  const startOffer = async (nextSlot: 1 | 2) => {
    setError(null);
    setSlot(nextSlot);
    setStatus("offer");
    room.self.name = name.trim() || "Ventana";
    try {
      let link!: DataLink;
      const result = await createHostOffer(
        nextSlot,
        room.self.name,
        extras,
        (msg) => {
          if (msg.t === "hello") room.attachLink(msg.player.id, link);
          room.handle(msg);
          setConnected(room.connected);
        },
        () => {
          setStatus("up");
          setConnected(room.connected);
        },
        () => {
          setError("Se cortó un asiento. Reintentá el QR.");
          setStatus("idle");
        },
      );
      link = result.link;
      linkRef.current = link;
      setCode(result.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el QR");
      setStatus("idle");
    }
  };

  const takeAnswer = async (answer: string) => {
    const link = linkRef.current;
    if (!link) return;
    try {
      await acceptHostAnswer(link, answer);
      setStatus("up");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Respuesta inválida");
    }
  };

  return (
    <div className="app">
      <Button variant="ghost" onClick={onBack}>
        ← atrás
      </Button>
      <div className="brand">
        <div className="eyebrow">asiento 17A</div>
        <h1>Abrir cabina</h1>
        <p className="lede">
          Prendé el hotspot. Los otros se conectan a tu Wi‑Fi y después escanean. Vos sos el
          anfitrión.
        </p>
      </div>
      <Field label="Tu nombre">
        <input value={name} maxLength={12} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="IP del hotspot (si no engancha, suele ser 192.168.43.1 o 172.20.10.1)">
        <input
          value={ip}
          placeholder="opcional"
          onChange={(e) => setIp(e.target.value)}
          inputMode="decimal"
        />
      </Field>
      <Panel>
        <p>
          Asientos ocupados: <b>{connected}/3</b>
        </p>
      </Panel>
      {status === "idle" || status === "up" ? (
        <div className="stack">
          {connected < 3 ? (
            <Button variant="amber" onClick={() => void startOffer(connected === 1 ? 1 : 2)}>
              Conectar asiento {connected === 1 ? "17B" : "17C"}
            </Button>
          ) : null}
          <Button disabled={connected < 2} onClick={() => onReady(room)}>
            Entrar al lobby
          </Button>
        </div>
      ) : null}
      {status === "offer" ? (
        <div className="stack">
          <p className="lede">
            Que el asiento {slot === 1 ? "17B" : "17C"} toque <b>Subirme</b> y escanee esto. Después
            escaneás el QR que le aparece.
          </p>
          {code ? <QrCard value={code} /> : <p>Generando código…</p>}
          <Button variant="mint" onClick={() => setStatus("scan")}>
            Ya escaneó, ahora yo escaneo
          </Button>
        </div>
      ) : null}
      {status === "scan" ? <QrScanner onCode={(v) => void takeAnswer(v)} onCancel={() => setStatus("offer")} /> : null}
      {error ? <p className="bad">{error}</p> : null}
    </div>
  );
}
