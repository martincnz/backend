import { assertNever, type GameId } from "../types";
import { gameTitle } from "../games/registry";
import { CinturonGame } from "../games/cinturon/CinturonGame";
import { DibujoGame } from "../games/dibujo/DibujoGame";
import { TemblorGame } from "../games/temblor/TemblorGame";
import { PilotoGame } from "../games/piloto/PilotoGame";
import { TurboGame } from "../games/turbo/TurboGame";
import { EcoGame } from "../games/eco/EcoGame";
import type { GameRoom } from "../net/room";
import type { RoomSnapshot } from "../net/room";
import { Button } from "./kit";

export function GameTable({
  room,
  snap,
  asId,
}: {
  room: GameRoom;
  snap: RoomSnapshot;
  asId: string;
}) {
  if (!snap.game || snap.state === null) {
    return (
      <div className="app">
        <p className="lede">Subiendo el juego a la cabina…</p>
      </div>
    );
  }
  const game: GameId = snap.game;
  let body;
  switch (game) {
    case "cinturon":
      body = <CinturonGame room={room} snap={snap} asId={asId} />;
      break;
    case "dibujo":
      body = <DibujoGame room={room} snap={snap} asId={asId} />;
      break;
    case "temblor":
      body = <TemblorGame room={room} snap={snap} asId={asId} />;
      break;
    case "piloto":
      body = <PilotoGame room={room} snap={snap} asId={asId} />;
      break;
    case "turbo":
      body = <TurboGame room={room} snap={snap} asId={asId} />;
      break;
    case "eco":
      body = <EcoGame room={room} snap={snap} asId={asId} />;
      break;
    default:
      body = assertNever(game);
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
        <h2>{gameTitle(game)}</h2>
      </div>
      {body}
    </div>
  );
}
