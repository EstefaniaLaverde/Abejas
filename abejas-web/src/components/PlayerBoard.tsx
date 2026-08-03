import type { PlayerJSON } from "../types";
import PlotView from "./PlotView";

interface Props {
  player: PlayerJSON;
  isCurrentTurn: boolean;
  isSelf: boolean;
  onHarvest: (plotIndex: number) => void;
  /** Si se da, se muestra un botón para elegir esa parcela como destino (sembrar/plantar). */
  onSelectTarget?: (plotIndex: number) => void;
  targetLabel?: string;
}

export default function PlayerBoard({ player, isCurrentTurn, isSelf, onHarvest, onSelectTarget, targetLabel }: Props) {
  return (
    <div className={"player-board" + (isCurrentTurn ? " current-turn" : "") + (isSelf ? " self" : "")}>
      <div className="player-board-header">
        <h3>
          {isCurrentTurn && "▶ "}
          {player.name}
          {isSelf && " (tú)"}
          {!player.connected && <span className="muted"> — desconectado</span>}
        </h3>
        <span className="bees">🐝 {player.bees}</span>
        <span className="muted">✋ {player.handCount}</span>
      </div>

      <div className="plots">
        {player.plots.map((plot, i) => (
          <PlotView
            key={i}
            plot={plot}
            index={i}
            onHarvest={isSelf && plot.cards.length > 0 ? () => onHarvest(i) : undefined}
            onSelectTarget={isSelf && onSelectTarget ? () => onSelectTarget(i) : undefined}
            targetLabel={targetLabel}
          />
        ))}
      </div>
    </div>
  );
}
