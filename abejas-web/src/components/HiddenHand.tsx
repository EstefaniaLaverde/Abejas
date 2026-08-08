import CardBack from "./CardBack";

interface Props {
  count: number;
}

/** Abanico de reversos que representa la mano oculta de otro jugador. */
export default function HiddenHand({ count }: Props) {
  if (count === 0) return <p className="muted">Sin cartas en mano.</p>;

  const visible = Math.min(count, 7);
  return (
    <div className="hidden-hand" aria-label={`${count} carta(s) en mano`}>
      {Array.from({ length: visible }).map((_, i) => (
        <CardBack key={i} small style={{ zIndex: i }} />
      ))}
      {count > visible && <span className="hidden-hand-extra">+{count - visible}</span>}
    </div>
  );
}
