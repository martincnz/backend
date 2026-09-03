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
  return (
    <div className="app">
      <div className="brand">
        <div className="eyebrow">vuelo nocturno</div>
        <h1>Modo Avión</h1>
        <p className="lede">
          Tres asientos. Cero internet. Una cabina de jueguitos para el rato en el aire.
        </p>
      </div>
      <div className="stack">
        <Button onClick={() => onGo("host")}>Abrir cabina</Button>
        <Button variant="mint" onClick={() => onGo("join")}>
          Subirme
        </Button>
        <Button variant="secondary" onClick={() => onGo("pass")}>
          Pasar el celular
        </Button>
      </div>
      {canInstall ? (
        <Button variant="amber" onClick={onInstall}>
          Instalar en el celular
        </Button>
      ) : null}
      {iosHint ? (
        <p className="lede">
          En iPhone: Compartir → <b>Agregar a inicio</b>. Hacelo antes de despegar.
        </p>
      ) : null}
      <div className="panel help">
        <details>
          <summary>¿Cómo nos conectamos en el avión?</summary>
          <p>
            Los navegadores no pueden armar una red Bluetooth entre tres celulares. El truco que sí
            funciona sin internet:
          </p>
          <p>
            1. Un celular prende el <b>hotspot / punto de acceso</b> (sigue andando en modo avión).
            Ese celular es el que abre la cabina.
          </p>
          <p>2. Los otros dos se conectan a ese Wi‑Fi. No hace falta que haya internet.</p>
          <p>3. Escanean el QR para emparejarse. Listo: los juegos viajan por esa red local.</p>
          <p>
            Instalá esta app (o abrila una vez con Wi‑Fi) <b>antes del vuelo</b> para que quede
            cacheada offline.
          </p>
        </details>
      </div>
    </div>
  );
}
