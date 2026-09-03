import { useEffect, useRef, useState } from "react";
import { makeQrDataUrl, scanQr } from "../qr/qr";
import { Button, Field } from "./kit";

export function QrCard({ value }: { value: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void makeQrDataUrl(value).then((url) => {
      if (alive) setSrc(url);
    });
    return () => {
      alive = false;
    };
  }, [value]);
  return (
    <div className="stack">
      <div className="qr-wrap">{src ? <img src={src} alt="Código QR" /> : <p>Armando QR…</p>}</div>
      <code className="kicker">{value}</code>
    </div>
  );
}

export function QrScanner({
  onCode,
  onCancel,
}: {
  onCode: (value: string) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cb = useRef(onCode);
  cb.current = onCode;
  const [manual, setManual] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let stop: (() => void) | undefined;
    let alive = true;
    let once = false;
    void scanQr(video, (value) => {
      if (!alive || once) return;
      once = true;
      cb.current(value);
    })
      .then((fn) => {
        stop = fn;
      })
      .catch(() => setError("No se pudo abrir la cámara. Pegá el código abajo."));
    return () => {
      alive = false;
      stop?.();
    };
  }, []);
  return (
    <div className="stack">
      <div className="qr-wrap">
        <video ref={videoRef} playsInline muted />
      </div>
      {error ? <p className="lede">{error}</p> : null}
      <Field label="O pegá el código">
        <textarea value={manual} onChange={(e) => setManual(e.target.value)} rows={3} />
      </Field>
      <div className="row">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button disabled={!manual.trim()} onClick={() => onCode(manual.trim())}>
          Usar código
        </Button>
      </div>
    </div>
  );
}
