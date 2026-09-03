import { useRef, useState } from "react";
import { answerHostOffer, type DataLink } from "../net/webrtc";
import { GameRoom } from "../net/room";
import { Button, Field } from "./kit";
import { QrCard, QrScanner } from "./Qr";

export function JoinSetup({
  onReady,
  onBack,
}: {
  onReady: (room: GameRoom) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("Pasillo");
  const [phase, setPhase] = useState<"scan" | "show" | "wait">("scan");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const roomRef = useRef<GameRoom | null>(null);
  const linkRef = useRef<DataLink | null>(null);

  const join = async (offer: string) => {
    setError(null);
    const room = new GameRoom("guest", name.trim() || "Pasillo", 1);
    roomRef.current = room;
    try {
      const { answerCode, pc } = await answerHostOffer(
        offer,
        room.self.name,
        [],
        (msg) => room.handle(msg),
        (link) => {
          linkRef.current = link;
          room.attachLink("host", link);
          room.hello();
          onReady(room);
        },
        () => setError("Se cortó la cabina"),
      );
      void pc;
      setAnswer(answerCode);
      setPhase("show");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo leer el QR");
      setPhase("scan");
    }
  };

  return (
    <div className="app">
      <Button variant="ghost" onClick={onBack}>
        ← atrás
      </Button>
      <div className="brand">
        <div className="eyebrow">pasillo</div>
        <h1>Subirme</h1>
        <p className="lede">
          Sin computadora. Conectate al hotspot del otro celular (el que abrió la cabina) y
          escaneá su QR.
        </p>
      </div>
      <Field label="Tu nombre">
        <input value={name} maxLength={12} onChange={(e) => setName(e.target.value)} />
      </Field>
      {phase === "scan" ? (
        <QrScanner onCode={(v) => void join(v)} onCancel={onBack} />
      ) : null}
      {phase === "show" ? (
        <div className="stack">
          <p className="lede">Mostrale este QR al que abrió la cabina para terminar el emparejado.</p>
          <QrCard value={answer} />
          <p className="lede">Cuando conecte, entras solo al lobby.</p>
        </div>
      ) : null}
      {error ? <p className="bad">{error}</p> : null}
    </div>
  );
}
