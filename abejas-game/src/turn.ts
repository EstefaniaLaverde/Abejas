import type { GameState } from "./types.js";
import {
  assertIsCurrentPlayer,
  assertPhase,
  getPlayer,
  log,
} from "./state-helpers.js";
import { drawCardsWithRoundTransition } from "./deck-draw.js";
import { triggerEndOfMainPlay } from "./endgame.js";

/**
 * Última etapa del turno: se roban 3 cartas del mazo, en orden, y se añaden
 * al final de la mano. Si el mazo (incluyendo la segunda ronda con el
 * compost) se agota en este punto, la partida pasa directo a la ronda final
 * de trueques en vez de continuar con el siguiente jugador.
 */
export function drawEndOfTurnCards(state: GameState, playerId: string): void {
  assertIsCurrentPlayer(state, playerId);
  assertPhase(state, "toma");
  const player = getPlayer(state, playerId);

  const { cards, exhausted } = drawCardsWithRoundTransition(state, 3);
  player.hand.push(...cards);
  if (cards.length > 0) {
    log(state, `${player.name} toma ${cards.length} carta(s) al final de su turno.`);
  }

  if (exhausted) {
    triggerEndOfMainPlay(state);
    return;
  }

  advanceTurn(state);
}

/** Pasa el turno al siguiente jugador hacia la derecha (orden fijo). */
export function advanceTurn(state: GameState): void {
  const previous = getPlayer(state, state.players[state.currentPlayerIndex]!.id);
  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  state.phase = "siembra";
  const next = state.players[state.currentPlayerIndex]!;
  log(state, `Turno de ${previous.name} termina. Ahora es el turno de ${next.name}.`);
}
