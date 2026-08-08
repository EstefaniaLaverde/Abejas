import CardBack from "./CardBack";
import { cardImageUrl, cardTypeName } from "../cardDisplay";

interface Props {
  count: number;
  label: string;
  variant?: "deck" | "compost";
  /** Solo compost: tipo de la última carta descartada, boca arriba encima de la pila (como en la mesa física). */
  topCardTypeId?: string;
}

/** Pila visual (mazo o compost) con un par de reversos apilados y el conteo. */
export default function CardPile({ count, label, variant = "deck", topCardTypeId }: Props) {
  const showTopCardFaceUp = variant === "compost" && Boolean(topCardTypeId);

  return (
    <div className="card-pile">
      <div className={"card-pile-stack" + (variant === "compost" ? " compost" : "")}>
        <CardBack small />
        {showTopCardFaceUp ? (
          <img
            className="card-pile-top-card"
            src={cardImageUrl(topCardTypeId!)}
            alt={cardTypeName(topCardTypeId!)}
          />
        ) : (
          <CardBack small />
        )}
      </div>
      <div className="card-pile-info">
        <strong>{count}</strong>
        <span className="muted">{label}</span>
      </div>
    </div>
  );
}
