import type { PlotJSON } from "../types";
import { groupByType } from "../cardDisplay";
import CardBadge from "./CardBadge";

interface Props {
  plot: PlotJSON;
  index: number;
  onHarvest?: () => void;
  /** Si se da, la parcela se puede elegir como destino (sembrar / plantar). */
  onSelectTarget?: () => void;
  targetLabel?: string;
}

export default function PlotView({ plot, index, onHarvest, onSelectTarget, targetLabel }: Props) {
  const groups = groupByType(plot.cards);
  const isEmpty = plot.cards.length === 0;

  return (
    <div className={"plot" + (isEmpty ? " empty" : "")}>
      <div className="plot-header">
        <span>Parcela {index + 1}</span>
      </div>

      <div className="plot-cards">
        {isEmpty ? (
          <span className="plot-empty-slot muted">vacía</span>
        ) : (
          groups.map((g) => <CardBadge key={g.typeId} typeId={g.typeId} count={g.count} />)
        )}
      </div>

      {!isEmpty && onHarvest && (
        <button type="button" className="harvest-button" onClick={onHarvest}>
          Cosechar
        </button>
      )}

      {onSelectTarget && (
        <button type="button" className="target-button" onClick={onSelectTarget}>
          {targetLabel ?? "Elegir esta parcela"}
        </button>
      )}
    </div>
  );
}
