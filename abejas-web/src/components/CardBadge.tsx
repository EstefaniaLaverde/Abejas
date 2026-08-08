import { useState } from "react";
import { cardImageUrl, cardTypeName } from "../cardDisplay";
import { CloseIcon, SearchIcon } from "./icons";

interface Props {
  typeId: string;
  count?: number;
  selected?: boolean;
  onClick?: () => void;
  title?: string;
}

/**
 * Miniatura de una carta. Incluye una lupa para ampliarla en una ventana
 * emergente: ahí se ve con claridad la tabla de conversión impresa en el
 * arte de la carta, sin depender de una tabla aparte en la interfaz.
 */
export default function CardBadge({ typeId, count, selected, onClick, title }: Props) {
  const name = cardTypeName(typeId);
  const [zoomed, setZoomed] = useState(false);

  return (
    <div className="card-badge-wrap">
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

      <button
        type="button"
        className="card-zoom-trigger"
        aria-label={`Ampliar carta de ${name}`}
        onClick={(e) => {
          e.stopPropagation();
          setZoomed(true);
        }}
      >
        <SearchIcon size={11} />
      </button>

      {zoomed && (
        <div className="card-zoom-overlay" onClick={() => setZoomed(false)}>
          <div className="card-zoom-content" onClick={(e) => e.stopPropagation()}>
            <img src={cardImageUrl(typeId)} alt={name} />
            <button type="button" className="card-zoom-close" onClick={() => setZoomed(false)}>
              <CloseIcon size={13} />
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
