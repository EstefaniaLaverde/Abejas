import type { PlayerJSON } from "../types";
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

  return (
    <div className="sow-panel">
      <p>
        {awaitingOptionalSow ? "Puedes sembrar esta segunda carta (opcional):" : "Debes sembrar esta carta:"}
      </p>
      <CardBadge typeId={card.typeId} />
      <div className="target-buttons">
        {me.plots.map((_, i) => (
          <button key={i} type="button" onClick={() => send(messageType, { plotIndex: i })}>
            Parcela {i + 1}
          </button>
        ))}
      </div>
      {awaitingOptionalSow && (
        <button type="button" className="link-button" onClick={() => send("skipOptionalSow")}>
          No sembrar esta carta
        </button>
      )}
    </div>
  );
}
