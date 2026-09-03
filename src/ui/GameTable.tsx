import type { GameRoom, RoomSnapshot } from "../net/room";
import { Button } from "./kit";
import { TetrisGame } from "../games/tetris/TetrisGame";

export function GameTable({ room, snap, asId }: { room: GameRoom; snap: RoomSnapshot; asId: string }) {
  if (!snap.game || snap.state === null) {
    return (
      <div className="app">
        <p className="lede">Subiendo el juego a la cabina…</p>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="row">
        {snap.role === "host" ? (
          <Button variant="ghost" onClick={() => room.leaveGame()}>
            ← lobby
          </Button>
        ) : (
          <span className="lede">{snap.self.seat}</span>
        )}
        <h2>Tetris</h2>
      </div>
      <TetrisGame room={room} snap={snap} asId={asId} />
    </div>
  );
}

