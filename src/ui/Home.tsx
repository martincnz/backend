import { useState } from "react";
import { Button } from "./kit";

type Screen = "home" | "host" | "join" | "solo";

export function Home({
  onGo,
  canInstall,
  onInstall,
  iosHint,
}: {
  onGo: (screen: Screen) => void;
  canInstall: boolean;
  onInstall: () => void;
  iosHint: boolean;
}) {
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const share = async () => {
    const url = window.location.href.split("?")[0];
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Modo Avión",
          text: "Tetris online para el avión: 1 a 3 celulares con QR + hotspot.",
          url,
        });
        setShareMsg("Mandalo a los otros dos celulares.");
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareMsg("Link copiado. Pegalo en un mensaje.");
    } catch {
      setShareMsg(url);
    }
  };

  return (
    <div className="app">
      <div className="brand">
        <div className="eyebrow">solo celular</div>
        <h1>Modo Avión</h1>
        <p className="lede">
          Todo corre en el teléfono: dibujos y elecciones con verificación automática. No hay que
          “confiar” en el otro.
        </p>
      </div>
      <div className="stack">
        <Button onClick={() => onGo("solo")}>Jugar en este celular</Button>
        <p className="lede">Modo 1 jugador. Para 2-3 celulares: Abrir cabina/Subirme.</p>
      </div>
      <div className="panel stack">
        <b>¿Tienen tres celulares?</b>
        <p className="lede">
          Mandales esta misma página. En el avión, uno prende el hotspot y los otros se conectan a
          ese Wi‑Fi. Después escanean el QR. Nada de Bluetooth, nada de PC.
        </p>
        <Button variant="amber" onClick={() => void share()}>
          Mandar esta página
        </Button>
        {shareMsg ? <p className="ok">{shareMsg}</p> : null}
        <div className="row">
          <Button variant="secondary" onClick={() => onGo("host")}>
            Abrir cabina
          </Button>
          <Button variant="mint" onClick={() => onGo("join")}>
            Subirme
          </Button>
        </div>
      </div>
      {canInstall ? (
        <Button variant="amber" onClick={onInstall}>
          Dejarla instalada
        </Button>
      ) : null}
      {iosHint ? (
        <p className="lede">
          En iPhone: Compartir → <b>Agregar a inicio</b>. Hacelo con Wi‑Fi, después vuela sola.
        </p>
      ) : null}
    </div>
  );
}
