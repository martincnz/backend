import { assertNever, type GameId } from "../types";
import { gameTitle } from "../games/registry";
import { BastaGame } from "../games/basta/BastaGame";
import { DibujoGame } from "../games/dibujo/DibujoGame";
import { BombaGame } from "../games/bomba/BombaGame";
import { MenteGame } from "../games/mente/MenteGame";
import { TrivialGame } from "../games/trivial/TrivialGame";
import { MentirosoGame } from "../games/mentiroso/MentirosoGame";
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
    case "basta":
      body = <BastaGame room={room} snap={snap} asId={asId} />;
      break;
    case "dibujo":
      body = <DibujoGame room={room} snap={snap} asId={asId} />;
      break;
    case "bomba":
      body = <BombaGame room={room} snap={snap} asId={asId} />;
      break;
    case "mente":
      body = <MenteGame room={room} snap={snap} asId={asId} />;
      break;
    case "trivial":
      body = <TrivialGame room={room} snap={snap} asId={asId} />;
      break;
    case "mentiroso":
      body = <MentirosoGame room={room} snap={snap} asId={asId} />;
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
