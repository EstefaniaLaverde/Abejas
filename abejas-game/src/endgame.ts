import type { GameState, OfferedCard, RequestedCards, TradeOffer } from "./types.js";
import { GameError } from "./errors.js";
import { getPlayer, log, removeFromHand } from "./state-helpers.js";
import { validateRequestedCards, describeRequestedCards } from "./trade.js";

let finalOfferIdCounter = 0;
function nextFinalOfferId(): string {
  finalOfferIdCounter += 1;
  return `final-offer-${finalOfferIdCounter}`;
}

/**
 * Se agotó el mazo (tras la segunda ronda con el compost): se activa la
 * ronda final de trueques, en la que todos los jugadores pueden negociar
 * libremente antes del conteo final.
 */
export function triggerEndOfMainPlay(state: GameState): void {
  if (state.phase === "ronda-final-trueque" || state.phase === "terminado") return;
  state.phase = "ronda-final-trueque";
  state.awaitingOptionalSow = false;
  // Cualquier carta robada a medias que quedó sin jugar (por quedarse el
  // mazo sin cartas a mitad de un robo) se va al compost, no desaparece.
  if (state.pendingTradeDraw.length > 0) {
    state.compost.push(...state.pendingTradeDraw);
    state.pendingTradeDraw = [];
  }
  log(state, "Se agotaron las cartas. Comienza la ronda final de trueques.");
}

/**
 * En la ronda final, cualquier jugador (no solo el que tenga el turno)
 * puede ofrecer cartas de su mano a cambio de otras, o regalarlas a un
 * jugador específico (`toPlayerId`, sin pedir nada a cambio).
 */
export function proposeFinalRoundTrade(
  state: GameState,
  fromPlayerId: string,
  offeredCardIds: string[],
  requestedCards: RequestedCards[],
  toPlayerId?: string,
): TradeOffer {
  if (state.phase !== "ronda-final-trueque") {
    throw new GameError("Solo se puede proponer un trueque final durante la ronda final.");
  }
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
  const offeredCards: OfferedCard[] = offeredCardIds.map((cardId) => ({
    card: removeFromHand(player, cardId),
    origin: "hand" as const,
  }));

  const offer: TradeOffer = {
    id: nextFinalOfferId(),
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
    message = `[Ronda final] ${player.name} le regala ${offeredList} a ${target.name}.`;
  } else if (target) {
    message = `[Ronda final] ${player.name} le ofrece ${offeredList} a ${target.name} a cambio de ${describeRequestedCards(requestedCards)}.`;
  } else {
    message = `[Ronda final] ${player.name} ofrece ${offeredList} a cambio de ${describeRequestedCards(requestedCards)}.`;
  }
  log(state, message);
  return offer;
}

/**
 * Cierra la ronda final de trueques y termina la partida: calcula el
 * ganador por abejas, desempatando por número de cartas en mano. No se
 * descartan las cartas que queden en mano de cada jugador.
 */
export function endFinalTradeRoundAndFinishGame(state: GameState): void {
  if (state.phase !== "ronda-final-trueque") {
    throw new GameError("No se está en la ronda final de trueques.");
  }
  const pendingOffers = state.tradeOffers.filter((o) => o.status === "pendiente");
  if (pendingOffers.length > 0) {
    throw new GameError("Hay ofertas de la ronda final por resolver.");
  }
  if (state.pendingMandatoryPlants.length > 0) {
    throw new GameError("Hay cartas de la ronda final pendientes de sembrar.");
  }

  state.finalTradeRoundDone = true;
  state.phase = "terminado";

  let winner = state.players[0]!;
  for (const player of state.players) {
    if (player.bees > winner.bees) {
      winner = player;
    } else if (player.bees === winner.bees && player.hand.length > winner.hand.length) {
      winner = player;
    }
  }
  state.winnerId = winner.id;
  log(
    state,
    `Partida terminada. Gana ${winner.name} con ${winner.bees} abejas (${winner.hand.length} cartas en mano).`,
  );
}
