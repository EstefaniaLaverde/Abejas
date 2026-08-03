import type { CardJSON } from "../types";
import CardBadge from "./CardBadge";

interface Props {
  hand: CardJSON[];
  /** Resalta la primera carta (la próxima obligatoria a sembrar). */
  highlightFirst?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (cardId: string) => void;
}

export default function HandView({ hand, highlightFirst, selectable, selectedIds, onToggleSelect }: Props) {
  if (hand.length === 0) {
    return <p className="muted">Sin cartas en mano.</p>;
  }

  return (
    <div className="hand">
      {hand.map((card, i) => (
        <CardBadge
          key={card.id}
          typeId={card.typeId}
          selected={selectedIds?.includes(card.id)}
          onClick={selectable ? () => onToggleSelect?.(card.id) : undefined}
          title={highlightFirst && i === 0 ? "Próxima carta obligatoria" : undefined}
        />
      ))}
    </div>
  );
}
