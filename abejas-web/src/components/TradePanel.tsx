import { useState } from "react";
import type { CardJSON, PlayerJSON, RequestedCardsJSON, TradeOfferJSON } from "../types";
import { ALL_CARD_TYPE_IDS, cardTypeName } from "../cardDisplay";
import CardBadge from "./CardBadge";
import HandView from "./HandView";

interface Props {
  me: PlayerJSON;
  players: PlayerJSON[];
  tradeOffers: TradeOfferJSON[];
  /** Cartas robadas que también se pueden ofrecer (fase de trueque normal). */
  drawnCards?: CardJSON[];
  proposeMessageType: "proposeTrade" | "proposeFinalRoundTrade";
  /** En la fase de trueque normal solo el jugador en turno puede proponer. */
  canPropose?: boolean;
  send: (type: string, payload?: unknown) => void;
}

export default function TradePanel({
  me,
  players,
  tradeOffers,
  drawnCards = [],
  proposeMessageType,
  canPropose = true,
  send,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [requestedCards, setRequestedCards] = useState<RequestedCardsJSON[]>([]);
  const [draftTypeId, setDraftTypeId] = useState(ALL_CARD_TYPE_IDS[0]!);
  const [draftCount, setDraftCount] = useState(1);

  const otherPlayers = players.filter((p) => p.playerId !== me.playerId);
  /** "" = oferta abierta (cualquiera puede aceptarla); si no, es el id de un jugador específico. */
  const [toPlayerId, setToPlayerId] = useState("");

  const offerableCards = [...(me.hand ?? []), ...drawnCards];
  const isTargeted = Boolean(toPlayerId);
  const isPureGift = isTargeted && requestedCards.length === 0;

  function toggleSelect(cardId: string) {
    setSelectedIds((prev) => (prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]));
  }

  function addRequestedType() {
    if (draftCount < 1) return;
    setRequestedCards((prev) => {
      const withoutType = prev.filter((r) => r.typeId !== draftTypeId);
      return [...withoutType, { typeId: draftTypeId, count: draftCount }];
    });
  }

  function removeRequestedType(typeId: string) {
    setRequestedCards((prev) => prev.filter((r) => r.typeId !== typeId));
  }

  // Una oferta abierta (sin destinatario) siempre debe pedir algo a cambio;
  // una oferta dirigida a un jugador puede ir vacía (regalo puro) o pedir algo.
  const canSubmit = selectedIds.length > 0 && (isTargeted || requestedCards.length > 0);

  function proposeTrade(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    send(proposeMessageType, {
      offeredCardIds: selectedIds,
      requestedCards,
      ...(isTargeted ? { toPlayerId } : {}),
    });
    setSelectedIds([]);
    setRequestedCards([]);
  }

  function playerName(playerId: string): string {
    return players.find((p) => p.playerId === playerId)?.name ?? playerId;
  }

  const pendingOffers = tradeOffers.filter((o) => o.status === "pendiente");
  const myHandCountByType = new Map<string, number>();
  for (const card of me.hand ?? []) {
    myHandCountByType.set(card.typeId, (myHandCountByType.get(card.typeId) ?? 0) + 1);
  }

  return (
    <div className="trade-panel">
      <h4>Trueque</h4>

      {drawnCards.length > 0 && (
        <div className="drawn-cards">
          <p className="muted">Cartas robadas, boca arriba (deben jugarse):</p>
          <div className="hand">
            {drawnCards.map((c) => (
              <CardBadge key={c.id} typeId={c.typeId} />
            ))}
          </div>
        </div>
      )}

      {canPropose && (
        <form className="propose-trade-form" onSubmit={proposeTrade}>
          <p className="muted">Elige las cartas que ofreces:</p>
          <HandView hand={offerableCards} selectable selectedIds={selectedIds} onToggleSelect={toggleSelect} />

          <div className="propose-trade-row">
            <label>
              Ofrecer a
              <select value={toPlayerId} onChange={(e) => setToPlayerId(e.target.value)}>
                <option value="">Cualquiera (oferta abierta)</option>
                {otherPlayers.map((p) => (
                  <option key={p.playerId} value={p.playerId}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="muted">
            {isTargeted
              ? "A cambio de (opcional: déjalo vacío para regalarla directamente):"
              : "A cambio de (se pueden pedir varios tipos distintos):"}
          </p>
          <div className="propose-trade-row">
            <label>
              Tipo
              <select value={draftTypeId} onChange={(e) => setDraftTypeId(e.target.value)}>
                {ALL_CARD_TYPE_IDS.map((id) => (
                  <option key={id} value={id}>
                    {cardTypeName(id)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Cantidad
              <input
                type="number"
                min={1}
                max={12}
                value={draftCount}
                onChange={(e) => setDraftCount(Number(e.target.value))}
              />
            </label>
            <button type="button" onClick={addRequestedType}>
              Agregar
            </button>
          </div>

          {requestedCards.length > 0 && (
            <ul className="requested-cards-list">
              {requestedCards.map((r) => (
                <li key={r.typeId}>
                  {r.count}× {cardTypeName(r.typeId)}{" "}
                  <button type="button" onClick={() => removeRequestedType(r.typeId)}>
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!isTargeted && requestedCards.length === 0 && (
            <p className="muted">Una oferta abierta debe pedir algo a cambio, o elige un jugador para regalarla.</p>
          )}

          <button type="submit" disabled={!canSubmit}>
            {isPureGift ? "Regalar" : "Proponer trueque"}
          </button>
        </form>
      )}

      <div className="trade-offers">
        <p className="muted">Ofertas activas:</p>
        {pendingOffers.length === 0 && <p className="muted">Ninguna por ahora.</p>}
        <ul>
          {pendingOffers.map((offer) => {
            const isMine = offer.fromPlayerId === me.playerId;
            const isTargetedOffer = Boolean(offer.toPlayerId);
            const isPureGiftOffer = isTargetedOffer && offer.requestedCards.length === 0;
            const isTargetingMe = offer.toPlayerId === me.playerId;
            const iHaveEnough = offer.requestedCards.every(
              (r) => (myHandCountByType.get(r.typeId) ?? 0) >= r.count,
            );
            const requestedLabel = offer.requestedCards
              .map((r) => `${r.count}× ${cardTypeName(r.typeId)}`)
              .join(", ");
            return (
              <li key={offer.id} className="trade-offer">
                <span>
                  <strong>{playerName(offer.fromPlayerId)}</strong>{" "}
                  {isPureGiftOffer ? (
                    <>
                      le regala {offer.offeredCards.map((c) => cardTypeName(c.typeId)).join(", ")} a{" "}
                      <strong>{playerName(offer.toPlayerId)}</strong>
                    </>
                  ) : isTargetedOffer ? (
                    <>
                      le ofrece {offer.offeredCards.map((c) => cardTypeName(c.typeId)).join(", ")} a{" "}
                      <strong>{playerName(offer.toPlayerId)}</strong> a cambio de {requestedLabel}
                    </>
                  ) : (
                    <>
                      ofrece {offer.offeredCards.map((c) => cardTypeName(c.typeId)).join(", ")} a cambio de{" "}
                      {requestedLabel}
                    </>
                  )}
                </span>
                {isMine && (
                  <button type="button" onClick={() => send("cancelTrade", { offerId: offer.id })}>
                    Cancelar
                  </button>
                )}
                {!isMine && !isTargetedOffer && (
                  <button
                    type="button"
                    disabled={!iHaveEnough}
                    title={iHaveEnough ? undefined : "No tienes suficientes cartas de ese tipo"}
                    onClick={() => send("acceptTrade", { offerId: offer.id })}
                  >
                    Aceptar
                  </button>
                )}
                {!isMine && isTargetedOffer && isTargetingMe && (
                  <span className="gift-actions">
                    <button
                      type="button"
                      disabled={!iHaveEnough}
                      title={iHaveEnough ? undefined : "No tienes suficientes cartas de ese tipo"}
                      onClick={() => send("acceptTrade", { offerId: offer.id })}
                    >
                      Aceptar
                    </button>
                    <button type="button" onClick={() => send("rejectTrade", { offerId: offer.id })}>
                      Rechazar
                    </button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
