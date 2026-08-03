import { validPlotIndexesForType } from "../src/sow.js";
import { sowMandatoryCard, sowOptionalCard, skipOptionalSow } from "../src/sow.js";
import { drawTradeCards, plantDrawnCard, finishTradePhase } from "../src/trade.js";
import { drawEndOfTurnCards } from "../src/turn.js";
import type { GameState } from "../src/types.js";

/** Elige una parcela para plantar `typeId`: preferentemente una válida sin descarte. */
function choosePlotIndex(state: GameState, playerId: string, typeId: string): number {
  const player = state.players.find((p) => p.id === playerId)!;
  const valid = validPlotIndexesForType(player, typeId);
  return valid[0] ?? 0;
}

function plantDirectlyOrSkip(
  state: GameState,
  playerId: string,
  cardId: string,
  typeId: string,
): void {
  const plotIndex = choosePlotIndex(state, playerId, typeId);
  plantDrawnCard(state, playerId, cardId, plotIndex);
}

/**
 * Bot mínimo: juega un turno completo con movimientos siempre válidos y sin
 * proponer trueques (para probar el flujo del motor de punta a punta). No
 * cosecha nunca, así que las parcelas seguirán creciendo turno a turno.
 */
export function playAutomatedTurn(state: GameState, playerId: string): void {
  // --- Siembra ---
  const player = state.players.find((p) => p.id === playerId)!;
  const firstCard = player.hand[0];
  if (firstCard) {
    sowMandatoryCard(state, playerId, choosePlotIndex(state, playerId, firstCard.typeId));
  }
  if ((state.phase as string) === "ronda-final-trueque" || state.phase === "terminado") return;

  if (state.awaitingOptionalSow) {
    const secondCard = player.hand[0];
    if (secondCard && validPlotIndexesForType(player, secondCard.typeId).length > 0) {
      sowOptionalCard(state, playerId, choosePlotIndex(state, playerId, secondCard.typeId));
    } else {
      skipOptionalSow(state, playerId);
    }
  }
  if ((state.phase as string) === "ronda-final-trueque" || state.phase === "terminado") return;

  // --- Trueque (sin negociar, solo planta lo robado) ---
  drawTradeCards(state, playerId);
  if ((state.phase as string) === "ronda-final-trueque" || state.phase === "terminado") return;

  while (state.pendingTradeDraw.length > 0) {
    const card = state.pendingTradeDraw[0]!;
    plantDirectlyOrSkip(state, playerId, card.id, card.typeId);
  }
  finishTradePhase(state, playerId);
  if ((state.phase as string) === "ronda-final-trueque" || state.phase === "terminado") return;

  // --- Toma de cartas ---
  drawEndOfTurnCards(state, playerId);
}

/** Cuenta cuántas cartas hay en total en un GameState (debe ser siempre 150). */
export function countAllCards(state: GameState): number {
  let total = state.deck.length + state.compost.length + state.pendingTradeDraw.length;
  for (const player of state.players) {
    total += player.hand.length;
    total += player.bees;
    for (const plot of player.plots) total += plot.cards.length;
  }
  for (const offer of state.tradeOffers) {
    if (offer.status === "pendiente") total += offer.offeredCards.length;
  }
  for (const pending of state.pendingMandatoryPlants) {
    total += 1;
  }
  return total;
}
