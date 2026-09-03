import { useEffect, useState } from "react";
import { GameRoom } from "../net/room";
import { reduceGame, initGame } from "../games/registry";
import { useRoom } from "./hooks";
import { Button, Field } from "./kit";
import { TetrisGame } from "../games/tetris/TetrisGame";

export function SoloTetris({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState("Jugador");
  const [room] = useState(() => new GameRoom("host", "Jugador", 0));
  const snap = useRoom(room);

  useEffect(() => {
    // keep name updated for the local seat
    room.self.name = name.trim().slice(0, 12) || "Jugador";
  }, [name, room]);

  const start = () => {
    const seed = Date.now();
    room.attachEngine((state, action, from) => {
      if (!room.game) return state;
      return reduceGame(room.game, state, action, from, room.players);
    });
    room.startGame("tetris", seed, initGame("tetris", seed, room.players));
  };

  if (!snap.game || snap.state === null) {
    return (
      <div className="app">
        <Button variant="ghost" onClick={onBack}>
          ← home
        </Button>
        <div className="brand">
          <div className="eyebrow">1 celular</div>
          <h1>Tetris</h1>
          <p className="lede">Jugá solo en este teléfono. (Para 2-3 celulares: usá Host/Join.)</p>
        </div>

        <div className="stack">
          <Field label="Tu nombre">
            <input value={name} maxLength={12} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Button onClick={start}>Empezar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="row">
        <Button variant="ghost" onClick={onBack}>
          ← home
        </Button>
        <h2>Tetris</h2>
      </div>
      <TetrisGame room={room} snap={snap} asId={room.self.id} />
    </div>
  );
}

