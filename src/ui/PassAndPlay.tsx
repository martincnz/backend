import { useEffect, useMemo, useState } from "react";
import { GameRoom } from "../net/room";
import { LocalStar } from "../net/local";
import { needsPassCover, reduceGame, turnPlayerId } from "../games/registry";
import { Button, Field } from "./kit";
import { Lobby } from "./Lobby";
import { GameTable } from "./GameTable";
import { useRoom } from "./hooks";

export function PassAndPlay({ onBack }: { onBack: () => void }) {
  const [names, setNames] = useState(["Sofi", "Martín", "Lucho"]);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [asId, setAsId] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  if (!room) {
    return (
      <div className="app">
        <Button variant="ghost" onClick={onBack}>
          ← atrás
        </Button>
        <div className="brand">
          <div className="eyebrow">un solo celular</div>
          <h1>Pasar el celular</h1>
          <p className="lede">
            Tres nombres, un teléfono. El motor valida automáticamente los juegos en el celular.
          </p>
        </div>
        {names.map((n, i) => (
          <Field key={i} label={["17A ventana", "17B medio", "17C pasillo"][i] ?? "asiento"}>
            <input
              value={n}
              maxLength={12}
              onChange={(e) =>
                setNames((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))
              }
            />
          </Field>
        ))}
        <Button
          onClick={() => {
            const next = new GameRoom("host", names[0] || "Sofi", 0);
            next.addLocalPlayer(names[1] || "Martín", 1);
            next.addLocalPlayer(names[2] || "Lucho", 2);
            next.attachEngine((state, action, from) => {
              if (!next.game) return state;
              return reduceGame(next.game, state, action, from, next.players);
            });
            setRoom(next);
            setAsId(next.self.id);
          }}
        >
          Listo, a jugar
        </Button>
      </div>
    );
  }

  return (
    <PassPlayShell room={room} asId={asId} setAsId={setAsId} hidden={hidden} setHidden={setHidden} />
  );
}

function PassPlayShell({
  room,
  asId,
  setAsId,
  hidden,
  setHidden,
}: {
  room: GameRoom;
  asId: string | null;
  setAsId: (id: string) => void;
  hidden: boolean;
  setHidden: (v: boolean) => void;
}) {
  const snap = useRoom(room);
  const current = asId ?? room.self.id;
  const cover = snap.game ? needsPassCover(snap.game) : false;

  useEffect(() => {
    if (!snap.game || snap.state === null) return;
    const turn = turnPlayerId(snap.game, snap.state);
    if (turn) setAsId(turn);
  }, [snap.game, snap.state, setAsId]);

  if (hidden) {
    return (
      <div className="hidden-info">
        <div className="stack">
          <h1>Pantalla tapada</h1>
          <p className="lede">Pasá el celular y tocá tu nombre.</p>
          {snap.players.map((p) => (
            <Button
              key={p.id}
              variant="amber"
              onClick={() => {
                setAsId(p.id);
                setHidden(false);
              }}
            >
              Soy {p.name}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="app" style={{ paddingBottom: 0, minHeight: 0 }}>
        {cover ? (
          <>
            <div className="row">
              {snap.players.map((p) => (
                <Button
                  key={p.id}
                  variant={p.id === current ? "amber" : "secondary"}
                  onClick={() => setAsId(p.id)}
                >
                  {p.name}
                </Button>
              ))}
            </div>
            <Button variant="coral" onClick={() => setHidden(true)}>
              Ocultar y pasar
            </Button>
          </>
        ) : (
          <p className="lede">El teléfono lleva el turno y el puntaje. Pasalo cuando te lo pida.</p>
        )}
      </div>
      {snap.game ? (
        <GameTable room={room} snap={snap} asId={current} />
      ) : (
        <Lobby room={room} snap={snap} solo />
      )}
    </>
  );
}

export function DemoTriple() {
  const rooms = useMemo(() => {
    const star = new LocalStar();
    const host = new GameRoom("host", "Sofi", 0, "p1");
    const g1 = new GameRoom("guest", "Martín", 1, "p2");
    const g2 = new GameRoom("guest", "Lucho", 2, "p3");
    const engine = (room: GameRoom) => {
      room.attachEngine((state, action, from) => {
        if (!room.game) return state;
        return reduceGame(room.game, state, action, from, room.players);
      });
    };
    engine(host);
    engine(g1);
    engine(g2);
    host.attachStar(star);
    g1.attachStar(star);
    g2.attachStar(star);
    host.localJoin(g1.self);
    host.localJoin(g2.self);
    return [host, g1, g2];
  }, []);

  return (
    <div className="phone-demo">
      {rooms.map((room) => (
        <div key={room.self.id} className="bezel">
          <DemoPhone room={room} />
        </div>
      ))}
    </div>
  );
}

function DemoPhone({ room }: { room: GameRoom }) {
  const snap = useRoom(room);
  if (snap.game) return <GameTable room={room} snap={snap} asId={room.self.id} />;
  return <Lobby room={room} snap={snap} />;
}
