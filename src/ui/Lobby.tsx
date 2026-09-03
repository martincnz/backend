import { useMemo } from "react";
import { initGame } from "../games/registry";
import type { Player } from "../types";
import type { GameRoom, RoomSnapshot } from "../net/room";
import { Panel, SeatMap, Button } from "./kit";

export function Lobby({ room, snap }: { room: GameRoom; snap: RoomSnapshot }) {
  const host = snap.role === "host";
  const seatsText = useMemo(() => {
    const occupied: Player[] = snap.players;
    return `${occupied.length}/3`;
  }, [snap.players]);

  const start = () => {
    const seed = Date.now();
    const initial = initGame("tetris", seed, room.players);
    room.startGame("tetris", seed, initial);
  };

  return (
    <div className="app">
      <div className="brand">
        <div className="eyebrow">cabina</div>
        <h1>Tetris online</h1>
        <p className="lede">
          {host
            ? "Esperá que entren hasta 3 celulares. Cuando querés, empezás la partida."
            : "Esperando a que el host arranque…"}
        </p>
      </div>

      <SeatMap players={snap.players} />

      {host ? (
        <div className="stack">
          <Panel>
            <p>
              Conectados: <b>{seatsText}</b>
            </p>
          </Panel>
          <Button onClick={start} disabled={snap.players.length === 0}>
            Empezar Tetris
          </Button>
        </div>
      ) : (
        <div className="stack">
          <Panel>
            <p>
              Conectados: <b>{seatsText}</b>
            </p>
          </Panel>
          <Button disabled>Esperá</Button>
        </div>
      )}
    </div>
  );
}

