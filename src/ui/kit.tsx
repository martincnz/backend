import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Player, Seat } from "../types";

export function Button({
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "amber" | "mint" | "coral";
}) {
  const cls =
    variant === "primary"
      ? "btn"
      : variant === "secondary"
        ? "btn secondary"
        : variant === "ghost"
          ? "btn ghost"
          : `btn ${variant}`;
  return <button type="button" className={cls} {...props} />;
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return <div className="panel">{children}</div>;
}

const SEAT_CLASS: Record<Seat, string> = {
  "17A": "a",
  "17B": "b",
  "17C": "c",
};

export function SeatMap({ players }: { players: Player[] }) {
  const seats: Seat[] = ["17A", "17B", "17C"];
  return (
    <div className="seats">
      {seats.map((seat) => {
        const player = players.find((p) => p.seat === seat);
        return (
          <div key={seat} className={`seat ${player ? `on ${SEAT_CLASS[seat]}` : ""}`}>
            <b>{seat}</b>
            <small>{player?.name ?? "vacío"}</small>
          </div>
        );
      })}
    </div>
  );
}

export function ScoreChips({
  players,
  scores,
}: {
  players: Player[];
  scores: Record<string, number>;
}) {
  return (
    <div className="scores">
      {players.map((p) => (
        <span key={p.id} className="chip">
          {p.seat} {p.name} · {scores[p.id] ?? 0}
        </span>
      ))}
    </div>
  );
}

export function playerName(players: Player[], id: string): string {
  return players.find((p) => p.id === id)?.name ?? "alguien";
}
