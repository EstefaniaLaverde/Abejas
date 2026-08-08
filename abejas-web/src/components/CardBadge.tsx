import { cardImageUrl, cardTypeName } from "../cardDisplay";

interface Props {
  typeId: string;
  count?: number;
  selected?: boolean;
  onClick?: () => void;
  title?: string;
}

export default function CardBadge({ typeId, count, selected, onClick, title }: Props) {
  const name = cardTypeName(typeId);
  return (
    <button
      type="button"
      className={"card-badge" + (selected ? " selected" : "") + (onClick ? "" : " static")}
      onClick={onClick}
      disabled={!onClick}
      title={title ?? name}
    >
      <img src={cardImageUrl(typeId)} alt={name} loading="lazy" />
      {typeof count === "number" && <span className="count">×{count}</span>}
    </button>
  );
}
