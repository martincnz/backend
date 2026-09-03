import QRCode from "qrcode";
import jsQR from "jsqr";

export async function makeQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
    color: { dark: "#0b1020", light: "#f6efe4" },
  });
}

export type StopScan = () => void;

export async function scanQr(
  video: HTMLVideoElement,
  onCode: (value: string) => void,
): Promise<StopScan> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } },
    audio: false,
  });
  video.srcObject = stream;
  await video.play();
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  let alive = true;
  const detector =
    window.BarcodeDetector !== undefined
      ? new window.BarcodeDetector({ formats: ["qr_code"] })
      : null;

  const tick = async () => {
    if (!alive) return;
    if (video.readyState >= 2 && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      try {
        if (detector) {
          const codes = await detector.detect(canvas);
          const value = codes[0]?.rawValue;
          if (value) onCode(value);
        } else {
          const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(image.data, image.width, image.height);
          if (code?.data) onCode(code.data);
        }
      } catch {
        /* keep scanning */
      }
    }
    if (alive) requestAnimationFrame(() => void tick());
  };
  void tick();
  return () => {
    alive = false;
    for (const track of stream.getTracks()) track.stop();
  };
}
