type PermissionedSensor = {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export function needsSensorPermission(): boolean {
  const motion = DeviceMotionEvent as unknown as PermissionedSensor;
  const orient = DeviceOrientationEvent as unknown as PermissionedSensor;
  return (
    typeof motion.requestPermission === "function" ||
    typeof orient.requestPermission === "function"
  );
}

export async function requestSensorPermission(): Promise<boolean> {
  const motion = DeviceMotionEvent as unknown as PermissionedSensor;
  const orient = DeviceOrientationEvent as unknown as PermissionedSensor;
  try {
    if (typeof motion.requestPermission === "function") {
      const result = await motion.requestPermission();
      if (result !== "granted") return false;
    }
    if (typeof orient.requestPermission === "function") {
      const result = await orient.requestPermission();
      if (result !== "granted") return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function buzz(ms = 40): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* iOS and some desktops ignore this */
  }
}

export function subscribeShake(onBurst: (burst: number) => void): () => void {
  const handler = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    const mag = Math.hypot(acc.x ?? 0, acc.y ?? 0, acc.z ?? 0);
    const burst = Math.max(0, mag - 10.8);
    if (burst > 0.35) onBurst(burst);
  };
  window.addEventListener("devicemotion", handler);
  return () => window.removeEventListener("devicemotion", handler);
}

export function subscribeTilt(onGamma: (gamma: number) => void): () => void {
  const handler = (event: DeviceOrientationEvent) => {
    onGamma(event.gamma ?? 0);
  };
  window.addEventListener("deviceorientation", handler);
  return () => window.removeEventListener("deviceorientation", handler);
}

export function pointerBurst(
  prev: { x: number; y: number; t: number } | null,
  x: number,
  y: number,
  t: number,
): { burst: number; next: { x: number; y: number; t: number } } {
  const next = { x, y, t };
  if (!prev) return { burst: 0, next };
  const dt = Math.max(8, t - prev.t);
  const dist = Math.hypot(x - prev.x, y - prev.y);
  const speed = dist / dt;
  return { burst: speed > 0.45 ? speed * 6 : 0, next };
}
