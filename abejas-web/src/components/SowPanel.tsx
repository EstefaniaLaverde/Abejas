import type { PlayerJSON } from "../types";
import { validPlotIndexesForType } from "../cardDisplay";
import CardBadge from "./CardBadge";

interface Props {
  me: PlayerJSON;
  awaitingOptionalSow: boolean;
  send: (type: string, payload?: unknown) => void;
}

export default function SowPanel({ me, awaitingOptionalSow, send }: Props) {
  const hand = me.hand ?? [];
  const card = hand[0];

  if (!card) {
    return <p className="muted">No tienes cartas para sembrar.</p>;
  }

  const messageType = awaitingOptionalSow ? "sowOptional" : "sowMandatory";
  const validIndexes = validPlotIndexesForType(me.plots, card.typeId);

  return (
    <div className="sow-panel">
      <p>
        {awaitingOptionalSow ? "Puedes sembrar esta segunda carta (opcional):" : "Debes sembrar esta carta:"}
      </p>
      <CardBadge typeId={card.typeId} />

      {validIndexes.length > 0 ? (
        <div className="target-buttons">
          {validIndexes.map((i) => (
            <button key={i} type="button" onClick={() => send(messageType, { plotIndex: i })}>
              Parcela {i + 1}
            </button>
          ))}
        </div>
      ) : (
        <p className="warning-text">
          No tienes una parcela vacía ni con este cultivo. Cosecha alguna parcela primero para poder sembrar.
        </p>
      )}

      {awaitingOptionalSow && (
        <button type="button" className="link-button" onClick={() => send("skipOptionalSow")}>
          No sembrar esta carta
        </button>
      )}
    </div>
  );
}
