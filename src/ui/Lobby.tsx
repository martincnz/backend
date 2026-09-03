import { GAMES, gameTitle, initGame } from "../games/registry";
import type { GameId } from "../types";
import type { GameRoom } from "../net/room";
import type { RoomSnapshot } from "../net/room";
import { Panel, SeatMap } from "./kit";

export function Lobby({
  room,
  snap,
  solo = false,
}: {
  room: GameRoom;
  snap: RoomSnapshot;
  solo?: boolean;
}) {
  const host = snap.role === "host";
  const start = (id: GameId) => {
    const seed = Date.now();
    const initial = initGame(id, seed, room.players, { solo });
    room.startGame(id, seed, initial);
  };
  return (
    <div className="app">
      <div className="brand">
        <div className="eyebrow">tablero de vuelo</div>
        <h1>Cabina</h1>
        <p className="lede">
          {host
            ? solo
              ? "El teléfono valida automáticamente con dibujos y opciones. No hace falta “confiar”."
              : "Elegí un juego cuando estén los tres. En tres celulares todos juegan a la vez."
            : "Esperá a que el asiento ventana elija el juego."}
        </p>
      </div>
      <SeatMap players={snap.players} />
      <div className="game-grid">
        {GAMES.map((game) => (
          <button
            key={game.id}
            type="button"
            className="game-card"
            disabled={!host}
            onClick={() => start(game.id)}
          >
            <div className="tag">{game.tag}</div>
            <h3>{game.title}</h3>
            <p className="lede">{game.blurb}</p>
          </button>
        ))}
      </div>
      {snap.selected ? (
        <Panel>
          <p>Próximo: {gameTitle(snap.selected)}</p>
        </Panel>
      ) : null}
    </div>
  );
}
