import { cardTypeColor, cardTypeName } from "../cardDisplay";

interface Props {
  typeId: string;
  count?: number;
  selected?: boolean;
  onClick?: () => void;
  title?: string;
}

export default function CardBadge({ typeId, count, selected, onClick, title }: Props) {
  return (
    <button
      type="button"
      className={"card-badge" + (selected ? " selected" : "") + (onClick ? "" : " static")}
      style={{ borderColor: cardTypeColor(typeId), background: onClick ? undefined : `${cardTypeColor(typeId)}22` }}
      onClick={onClick}
      disabled={!onClick}
      title={title}
    >
      <span className="dot" style={{ background: cardTypeColor(typeId) }} />
      {cardTypeName(typeId)}
      {typeof count === "number" && <span className="count">×{count}</span>}
    </button>
  );
}
