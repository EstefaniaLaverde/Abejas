import type { ReactNode } from "react";
import CardBack from "./CardBack";

interface Props {
  count: number;
  label: string;
  variant?: "deck" | "compost";
  /** Contenido opcional dentro de un <details> (ej. desglose por tipo). */
  detail?: ReactNode;
}

/** Pila visual (mazo o compost) con un par de reversos apilados y el conteo. */
export default function CardPile({ count, label, variant = "deck", detail }: Props) {
  const pile = (
    <div className="card-pile">
      <div className={"card-pile-stack" + (variant === "compost" ? " compost" : "")}>
        <CardBack small />
        <CardBack small />
      </div>
      <div className="card-pile-info">
        <strong>{count}</strong>
        <span className="muted">{label}</span>
      </div>
    </div>
  );

  if (!detail) return pile;

  return (
    <details className="card-pile-details">
      <summary>{pile}</summary>
      {detail}
    </details>
  );
}
