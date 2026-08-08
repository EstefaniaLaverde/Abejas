import type { GameState, OfferedCard, RequestedCards, TradeOffer } from "./types.js";
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
  if (state.tradeDrawnThisTurn) {
    throw new GameError(`${player.id} ya robó las cartas de trueque este turno.`);
  }
  state.tradeDrawnThisTurn = true;
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
 * Valida `requestedCards`. Se permite vacío (regalo: no se pide nada a
 * cambio), pero en ese caso `isGift` debe ser true, lo cual el llamador
 * garantiza exigiendo un `toPlayerId`.
 */
export function validateRequestedCards(requestedCards: RequestedCards[], isGift = false): void {
  if (requestedCards.length === 0 && !isGift) {
    throw new GameError("Debe pedirse al menos un tipo de cultivo (o dirigir la oferta a un jugador como regalo).");
  }
  for (const { typeId, count } of requestedCards) {
    if (!typeId) {
      throw new GameError("Debe indicarse el tipo de cultivo pedido.");
    }
    if (count <= 0) {
      throw new GameError("La cantidad pedida debe ser mayor a cero.");
    }
  }
}

export function describeRequestedCards(requestedCards: RequestedCards[]): string {
  if (requestedCards.length === 0) return "nada (regalo)";
  return requestedCards.map((r) => `${r.count}x ${r.typeId}`).join(", ");
}

/**
 * El jugador en turno propone un trueque: ofrece cartas (de su mano y/o de
 * las que acaba de robar) a cambio de `requestedCards`, que puede incluir
 * varios tipos de cultivo distintos.
 *
 * Si `toPlayerId` se da, es un regalo dirigido a ese jugador específico (solo
 * él puede aceptarlo o rechazarlo) y `requestedCards` puede ir vacío (no se
 * pide nada a cambio). Si no se da, la oferta es abierta: cualquier otro
 * jugador que tenga todas las cartas pedidas puede aceptarla, y debe pedirse
 * al menos un tipo de cultivo.
 */
export function proposeTrade(
  state: GameState,
  fromPlayerId: string,
  offeredCardIds: string[],
  requestedCards: RequestedCards[],
  toPlayerId?: string,
): TradeOffer {
  assertIsCurrentPlayer(state, fromPlayerId);
  assertPhase(state, "trueque");
  if (offeredCardIds.length === 0) {
    throw new GameError("Debe ofrecerse al menos una carta.");
  }
  if (toPlayerId) {
    if (toPlayerId === fromPlayerId) {
      throw new GameError("No puedes regalarte una carta a ti mismo.");
    }
    getPlayer(state, toPlayerId); // valida que exista
  }
  validateRequestedCards(requestedCards, Boolean(toPlayerId));
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
    requestedCards,
    ...(toPlayerId ? { toPlayerId } : {}),
    status: "pendiente",
  };
  state.tradeOffers.push(offer);
  const target = toPlayerId ? getPlayer(state, toPlayerId) : null;
  const offeredList = offeredCards.map((o) => o.card.typeId).join(", ");
  let message: string;
  if (target && requestedCards.length === 0) {
    message = `${player.name} le regala ${offeredList} a ${target.name}.`;
  } else if (target) {
    message = `${player.name} le ofrece ${offeredList} a ${target.name} a cambio de ${describeRequestedCards(requestedCards)}.`;
  } else {
    message = `${player.name} ofrece ${offeredList} a cambio de ${describeRequestedCards(requestedCards)}.`;
  }
  log(state, message);
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

/**
 * El destinatario de un regalo dirigido (`toPlayerId`) lo rechaza sin
 * aceptarlo. La(s) carta(s) ofrecida(s) vuelven a quien las regaló, igual
 * que al cancelar. Solo aplica a ofertas dirigidas: las ofertas abiertas no
 * se "rechazan" (simplemente no se aceptan, y el proponente puede
 * cancelarlas si quiere retirarlas).
 */
export function rejectTrade(state: GameState, offerId: string, playerId: string): void {
  const offer = state.tradeOffers.find((o) => o.id === offerId);
  if (!offer) throw new GameError(`Oferta desconocida: ${offerId}`);
  if (offer.status !== "pendiente") {
    throw new GameError(`La oferta ${offerId} ya no está pendiente.`);
  }
  if (offer.toPlayerId !== playerId) {
    throw new GameError(`${playerId} no puede rechazar una oferta que no está dirigida a él.`);
  }
  const offeror = getPlayer(state, offer.fromPlayerId);
  const rejecting = getPlayer(state, playerId);
  offer.status = "rechazada";
  returnRejectedOffer(state, offer);
  log(state, `${rejecting.name} rechaza el regalo de ${offeror.name}.`);
}

/**
 * Un jugador distinto al proponente acepta la oferta: entrega las cartas
 * pedidas en `requestedCards` (pudiendo ser de varios tipos distintos) de su
 * mano y recibe las cartas ofrecidas. Ambas partes quedan con la obligación
 * de sembrar lo que recibieron. Si la oferta es un regalo dirigido
 * (`toPlayerId`), solo ese jugador puede aceptarla.
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
  if (offer.toPlayerId && offer.toPlayerId !== acceptingPlayerId) {
    throw new GameError(`Esta oferta está dirigida a otro jugador.`);
  }
  const acceptor = getPlayer(state, acceptingPlayerId);
  const offeror = getPlayer(state, offer.fromPlayerId);

  const givenCards: OfferedCard["card"][] = [];
  for (const { typeId, count } of offer.requestedCards) {
    const matchingCards = acceptor.hand.filter(
      (c) => c.typeId === typeId && !givenCards.includes(c),
    );
    if (matchingCards.length < count) {
      throw new GameError(`${acceptor.id} no tiene ${count}x ${typeId} en mano.`);
    }
    givenCards.push(...matchingCards.slice(0, count));
  }
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
    `${acceptor.name} acepta el trueque de ${offeror.name}: entrega ${describeRequestedCards(offer.requestedCards)}, recibe ${offer.offeredCards.map((o) => o.card.typeId).join(", ")}.`,
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
  // `force = true`: al ser una siembra forzada por el trueque, el jugador
  // puede elegir descartar cualquiera de sus 3 parcelas, aunque tenga una
  // vacía o con el mismo cultivo disponible.
  plantCard(state, player, pending!.card, targetPlotIndex, true);
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
