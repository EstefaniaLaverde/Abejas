import type { PendingMandatoryPlantJSON, PlayerJSON } from "../types";
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
      {mine.map((pending) => (
        <div key={pending.card.id} className="pending-plant-row">
          <CardBadge typeId={pending.card.typeId} />
          {me.plots.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() =>
                send("plantMandatoryTradeCard", { cardId: pending.card.id, plotIndex: i })
              }
            >
              Parcela {i + 1}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
