import { useState } from "react";
import { Button } from "./kit";

type Screen = "home" | "host" | "join" | "pass";

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
          text: "Juegos para el avión, todo en el celular.",
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
          Todo corre en el teléfono. No hace falta notebook, ni tele, ni internet una vez que la
          abriste.
        </p>
      </div>
      <div className="stack">
        <Button onClick={() => onGo("pass")}>Jugar en este celular</Button>
        <p className="lede">Los tres se van pasando el teléfono. Listo para despegar.</p>
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
