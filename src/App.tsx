import { useCallback, useEffect, useState } from "react";
import { Home } from "./ui/Home";
import { HostSetup } from "./ui/HostSetup";
import { JoinSetup } from "./ui/JoinSetup";
import { Lobby } from "./ui/Lobby";
import { GameTable } from "./ui/GameTable";
import { PassAndPlay } from "./ui/PassAndPlay";
import { GameRoom } from "./net/room";
import { reduceGame } from "./games/registry";
import { useRoom, useWakeLock } from "./ui/hooks";

type Screen = "home" | "host" | "join" | "pass" | "play";

type InstallEvent = Event & { prompt: () => Promise<void> };

export function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  useWakeLock();

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !window.matchMedia("(display-mode: standalone)").matches;
    setIosHint(ios);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const ready = useCallback((next: GameRoom) => {
    next.attachEngine((state, action, from) => {
      if (!next.game) return state;
      return reduceGame(next.game, state, action, from, next.players);
    });
    setRoom(next);
    setScreen("play");
  }, []);

  if (screen === "host") return <HostSetup onBack={() => setScreen("home")} onReady={ready} />;
  if (screen === "join") return <JoinSetup onBack={() => setScreen("home")} onReady={ready} />;
  if (screen === "pass") return <PassAndPlay onBack={() => setScreen("home")} />;
  if (screen === "play" && room) return <Play room={room} />;

  return (
    <Home
      onGo={(s) => setScreen(s)}
      canInstall={Boolean(install)}
      iosHint={iosHint}
      onInstall={() => {
        void install?.prompt();
      }}
    />
  );
}

function Play({ room }: { room: GameRoom }) {
  const snap = useRoom(room);
  if (snap.game) return <GameTable room={room} snap={snap} asId={room.self.id} />;
  return <Lobby room={room} snap={snap} />;
}
