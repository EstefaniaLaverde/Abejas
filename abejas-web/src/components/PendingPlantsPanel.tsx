import type { PendingMandatoryPlantJSON, PlayerJSON } from "../types";
import { validPlotIndexesForType } from "../cardDisplay";
import CardBadge from "./CardBadge";

interface Props {
  me: PlayerJSON;
  pendingPlants: PendingMandatoryPlantJSON[];
  send: (type: string, payload?: unknown) => void;
}

/** Cartas que "me" recibió por trueque y está obligado a sembrar ya mismo. */
export default function PendingPlantsPanel({ me, pendingPlants, send }: Props) {
  const mine = pendingPlants.filter((p) => p.playerId === me.playerId);
  if (mine.length === 0) return null;

  return (
    <div className="pending-plants">
      <p>Recibiste estas cartas por trueque — debes sembrarlas ya:</p>
      {mine.map((pending) => {
        const validIndexes = validPlotIndexesForType(me.plots, pending.card.typeId);
        return (
          <div key={pending.card.id} className="pending-plant-row">
            <CardBadge typeId={pending.card.typeId} />
            {validIndexes.length > 0 ? (
              validIndexes.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => send("plantMandatoryTradeCard", { cardId: pending.card.id, plotIndex: i })}
                >
                  Parcela {i + 1}
                </button>
              ))
            ) : (
              <p className="warning-text">
                No tienes una parcela vacía ni con este cultivo. Cosecha alguna parcela primero para poder sembrar.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
