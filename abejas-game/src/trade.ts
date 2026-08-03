import type { GameState, OfferedCard, TradeOffer } from "./types.js";
import { GameError } from "./errors.js";
import {
  assertIsCurrentPlayer,
  assertPhase,
  getCurrentPlayer,
  getPlayer,
  log,
  plantCard,
  removeFromHand,
} from "./state-helpers.js";
import { drawCardsWithRoundTransition } from "./deck-draw.js";
import { triggerEndOfMainPlay } from "./endgame.js";

let offerIdCounter = 0;
function nextOfferId(): string {
  offerIdCounter += 1;
  return `offer-${offerIdCounter}`;
}

/**
 * Fase de trueque, paso 1: el jugador en turno roba 2 cartas del mazo y
 * quedan pendientes de jugarse (plantarlas directo o usarlas en un trueque).
 */
export function drawTradeCards(state: GameState, playerId: string): void {
  assertIsCurrentPlayer(state, playerId);
  assertPhase(state, "trueque");
  const player = getPlayer(state, playerId);
  if (state.pendingTradeDraw.length > 0) {
    throw new GameError(`${player.id} ya robó las cartas de trueque este turno.`);
  }
  const { cards, exhausted } = drawCardsWithRoundTransition(state, 2);
  state.pendingTradeDraw.push(...cards);
  if (cards.length > 0) {
    log(state, `${player.name} roba ${cards.length} carta(s) para el trueque.`);
  }
  if (exhausted) {
    triggerEndOfMainPlay(state);
  }
}

/** Planta directamente una de las cartas robadas del trueque (si le sirve al jugador). */
export function plantDrawnCard(
  state: GameState,
  playerId: string,
  cardId: string,
  targetPlotIndex: number,
): void {
  assertIsCurrentPlayer(state, playerId);
  assertPhase(state, "trueque");
  const player = getPlayer(state, playerId);
  const index = state.pendingTradeDraw.findIndex((c) => c.id === cardId);
  if (index === -1) {
    throw new GameError(`La carta ${cardId} no está entre las robadas pendientes.`);
  }
  const [card] = state.pendingTradeDraw.splice(index, 1);
  plantCard(state, player, card!, targetPlotIndex);
  log(state, `${player.name} planta directamente ${card!.typeId} (carta robada) en la parcela ${targetPlotIndex}.`);
}

/**
 * El jugador en turno propone un trueque abierto: ofrece cartas (de su mano
 * y/o de las que acaba de robar) a cambio de `requestedCount` cartas de
 * `requestedTypeId`. Cualquier otro jugador con esas cartas puede aceptarla.
 */
export function proposeTrade(
  state: GameState,
  fromPlayerId: string,
  offeredCardIds: string[],
  requestedTypeId: string,
  requestedCount: number,
): TradeOffer {
  assertIsCurrentPlayer(state, fromPlayerId);
  assertPhase(state, "trueque");
  if (offeredCardIds.length === 0) {
    throw new GameError("Debe ofrecerse al menos una carta.");
  }
  if (requestedCount <= 0) {
    throw new GameError("La cantidad pedida debe ser mayor a cero.");
  }
  const player = getPlayer(state, fromPlayerId);

  const offeredCards: OfferedCard[] = offeredCardIds.map((cardId) => {
    const drawnIndex = state.pendingTradeDraw.findIndex((c) => c.id === cardId);
    if (drawnIndex !== -1) {
      const [card] = state.pendingTradeDraw.splice(drawnIndex, 1);
      return { card: card!, origin: "drawn" as const };
    }
    const card = removeFromHand(player, cardId);
    return { card, origin: "hand" as const };
  });

  const offer: TradeOffer = {
    id: nextOfferId(),
    fromPlayerId,
    offeredCards,
    requestedTypeId,
    requestedCount,
    status: "pendiente",
  };
  state.tradeOffers.push(offer);
  log(
    state,
    `${player.name} ofrece ${offeredCards.map((o) => o.card.typeId).join(", ")} a cambio de ${requestedCount}x ${requestedTypeId}.`,
  );
  return offer;
}

function returnRejectedOffer(state: GameState, offer: TradeOffer): void {
  const player = getPlayer(state, offer.fromPlayerId);
  for (const { card, origin } of offer.offeredCards) {
    if (origin === "drawn") {
      // Las cartas robadas no jugadas vuelven a estar pendientes: el
      // jugador está obligado a plantarlas.
      state.pendingTradeDraw.push(card);
    } else {
      player.hand.push(card);
    }
  }
}

/** Cancela una oferta propia que sigue pendiente (solo quien la propuso puede cancelarla). */
export function cancelTrade(state: GameState, offerId: string, playerId: string): void {
  const offer = state.tradeOffers.find((o) => o.id === offerId);
  if (!offer) throw new GameError(`Oferta desconocida: ${offerId}`);
  if (offer.status !== "pendiente") {
    throw new GameError(`La oferta ${offerId} ya no está pendiente.`);
  }
  if (offer.fromPlayerId !== playerId) {
    throw new GameError(`${playerId} no puede cancelar una oferta que no es suya.`);
  }
  offer.status = "cancelada";
  returnRejectedOffer(state, offer);
  log(state, `Se cancela la oferta ${offerId}.`);
}

/** Un jugador rechaza (deja pasar) una oferta sin aceptarla; no cierra la oferta por sí sola. */

/**
 * Un jugador distinto al proponente acepta la oferta: entrega
 * `requestedCount` cartas de `requestedTypeId` de su mano y recibe las
 * cartas ofrecidas. Ambas partes quedan con la obligación de sembrar lo que
 * recibieron.
 */
export function acceptTrade(
  state: GameState,
  offerId: string,
  acceptingPlayerId: string,
): void {
  const offer = state.tradeOffers.find((o) => o.id === offerId);
  if (!offer) throw new GameError(`Oferta desconocida: ${offerId}`);
  if (offer.status !== "pendiente") {
    throw new GameError(`La oferta ${offerId} ya no está pendiente.`);
  }
  if (offer.fromPlayerId === acceptingPlayerId) {
    throw new GameError("El proponente no puede aceptar su propia oferta.");
  }
  const acceptor = getPlayer(state, acceptingPlayerId);
  const offeror = getPlayer(state, offer.fromPlayerId);

  const matchingCards = acceptor.hand.filter((c) => c.typeId === offer.requestedTypeId);
  if (matchingCards.length < offer.requestedCount) {
    throw new GameError(
      `${acceptor.id} no tiene ${offer.requestedCount}x ${offer.requestedTypeId} en mano.`,
    );
  }

  const givenCards = matchingCards.slice(0, offer.requestedCount);
  for (const card of givenCards) {
    removeFromHand(acceptor, card.id);
  }

  offer.status = "aceptada";

  for (const { card } of offer.offeredCards) {
    state.pendingMandatoryPlants.push({ playerId: acceptor.id, card, reason: "trueque" });
  }
  for (const card of givenCards) {
    state.pendingMandatoryPlants.push({ playerId: offeror.id, card, reason: "trueque" });
  }

  log(
    state,
    `${acceptor.name} acepta el trueque de ${offeror.name}: entrega ${givenCards.length}x ${offer.requestedTypeId}, recibe ${offer.offeredCards.map((o) => o.card.typeId).join(", ")}.`,
  );
}

/**
 * Siembra una carta recibida por trueque (obligatorio, para cualquier
 * jugador que tenga cartas pendientes, no solo el jugador en turno).
 */
export function plantMandatoryTradeCard(
  state: GameState,
  playerId: string,
  cardId: string,
  targetPlotIndex: number,
): void {
  const player = getPlayer(state, playerId);
  const index = state.pendingMandatoryPlants.findIndex(
    (p) => p.playerId === playerId && p.card.id === cardId,
  );
  if (index === -1) {
    throw new GameError(`${playerId} no tiene la carta ${cardId} pendiente de siembra obligatoria.`);
  }
  const [pending] = state.pendingMandatoryPlants.splice(index, 1);
  plantCard(state, player, pending!.card, targetPlotIndex);
  log(state, `${player.name} siembra ${pending!.card.typeId} (recibida por trueque) en la parcela ${targetPlotIndex}.`);
}

/**
 * Cierra la fase de trueque: solo posible cuando no quedan cartas robadas
 * sin jugar, ofertas pendientes ni siembras obligatorias de trueque.
 */
export function finishTradePhase(state: GameState, playerId: string): void {
  assertIsCurrentPlayer(state, playerId);
  assertPhase(state, "trueque");
  if (state.pendingTradeDraw.length > 0) {
    throw new GameError("Las cartas robadas para el trueque deben jugarse antes de continuar.");
  }
  const pendingOffers = state.tradeOffers.filter((o) => o.status === "pendiente");
  if (pendingOffers.length > 0) {
    throw new GameError("Hay ofertas de trueque pendientes por resolver.");
  }
  if (state.pendingMandatoryPlants.length > 0) {
    throw new GameError("Hay cartas de trueque pendientes de sembrar.");
  }
  const player = getCurrentPlayer(state);
  state.phase = "toma";
  log(state, `${player.name} termina la fase de trueque.`);
}
