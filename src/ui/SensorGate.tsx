import { useState, type ReactNode } from "react";
import { needsSensorPermission, requestSensorPermission } from "../lib/sensors";
import { Button } from "./kit";

export function SensorGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const [asked, setAsked] = useState(!needsSensorPermission());
  const [live, setLive] = useState(!needsSensorPermission());

  if (!asked) {
    return (
      <div className="stack">
        <p className="lede">
          El teléfono necesita el giroscopio o el acelerómetro. Tocá una vez para activarlos.
        </p>
        <Button
          onClick={() => {
            void requestSensorPermission().then((granted) => {
              setAsked(true);
              setLive(granted);
            });
          }}
        >
          Activar sensores
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setAsked(true);
            setLive(false);
          }}
        >
          Usar la pantalla
        </Button>
      </div>
    );
  }

  return (
    <div className="stack">
      {live ? children : fallback}
      {live ? (
        <button type="button" className="sensor-switch" onClick={() => setLive(false)}>
          ¿No se mueve? Usá la pantalla
        </button>
      ) : (
        <button type="button" className="sensor-switch" onClick={() => setLive(true)}>
          Probar sensores otra vez
        </button>
      )}
    </div>
  );
}

export function RoundBanner({
  round,
  total,
  turn,
  solo,
}: {
  round: number;
  total: number;
  turn: string;
  solo: boolean;
}) {
  return (
    <p className="lede">
      Ronda {round}/{total}
      {solo ? (
        <>
          {" "}
          · turno de <b>{turn}</b>
        </>
      ) : (
        " · todos a la vez"
      )}
    </p>
  );
}
