import { useEffect, useState } from "react";
import { GameRoom } from "../net/room";

export function useRoom(room: GameRoom) {
  const [snap, setSnap] = useState(() => room.snapshot());
  useEffect(() => {
    setSnap(room.snapshot());
    return room.subscribe(() => setSnap(room.snapshot()));
  }, [room]);
  return snap;
}

export function useCountdown(durationMs: number, running: boolean, token: string): number {
  const [left, setLeft] = useState(durationMs);
  const [seen, setSeen] = useState(token);
  if (seen !== token) {
    setSeen(token);
    setLeft(durationMs);
  }
  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    setLeft(durationMs);
    const id = window.setInterval(() => {
      setLeft(Math.max(0, durationMs - (Date.now() - start)));
    }, 100);
    return () => window.clearInterval(id);
  }, [durationMs, running, token]);
  return left;
}

export function useWakeLock(): void {
  useEffect(() => {
    let sentinel: WakeLockSentinel | undefined;
    const request = async () => {
      try {
        sentinel = await navigator.wakeLock?.request("screen");
      } catch {
        /* unsupported or battery saver */
      }
    };
    void request();
    const onVis = () => {
      if (document.visibilityState === "visible") void request();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      void sentinel?.release();
    };
  }, []);
}
