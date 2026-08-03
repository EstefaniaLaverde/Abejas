import type { GameState } from "./types.js";
import { GameError } from "./errors.js";
import {
  assertIsCurrentPlayer,
  assertPhase,
  getPlayer,
  log,
  plantCard,
} from "./state-helpers.js";

export { validPlotIndexesForType, canPlantWithoutDiscard } from "./state-helpers.js";

/**
 * Siembra la primera carta de la mano (obligatoria). `targetPlotIndex` debe
 * ser una parcela vacía o con el mismo cultivo; si ninguna existe, debe ser
 * una de las tres parcelas para descartarla y sembrar ahí.
 */
export function sowMandatoryCard(
  state: GameState,
  playerId: string,
  targetPlotIndex: number,
): void {
  assertIsCurrentPlayer(state, playerId);
  assertPhase(state, "siembra");
  if (state.awaitingOptionalSow) {
    throw new GameError("La siembra obligatoria ya se realizó este turno.");
  }
  const player = getPlayer(state, playerId);
  const card = player.hand[0];
  if (!card) {
    throw new GameError(`${player.id} no tiene cartas para la siembra obligatoria.`);
  }
  plantCard(state, player, card, targetPlotIndex);
  player.hand.shift();
  log(state, `${player.name} siembra ${card.typeId} en la parcela ${targetPlotIndex} (obligatoria).`);
  state.awaitingOptionalSow = true;
}

/** Siembra la segunda carta (opcional), si el jugador decide hacerlo. */
export function sowOptionalCard(
  state: GameState,
  playerId: string,
  targetPlotIndex: number,
): void {
  assertIsCurrentPlayer(state, playerId);
  assertPhase(state, "siembra");
  if (!state.awaitingOptionalSow) {
    throw new GameError("Primero debe hacerse la siembra obligatoria.");
  }
  const player = getPlayer(state, playerId);
  const card = player.hand[0];
  if (!card) {
    throw new GameError(`${player.id} no tiene más cartas para sembrar.`);
  }
  plantCard(state, player, card, targetPlotIndex);
  player.hand.shift();
  log(state, `${player.name} siembra ${card.typeId} en la parcela ${targetPlotIndex} (opcional).`);
  finishSowPhase(state, playerId);
}

/** El jugador decide no sembrar la segunda carta y pasa a la fase de trueque. */
export function skipOptionalSow(state: GameState, playerId: string): void {
  assertIsCurrentPlayer(state, playerId);
  assertPhase(state, "siembra");
  if (!state.awaitingOptionalSow) {
    throw new GameError("Primero debe hacerse la siembra obligatoria.");
  }
  finishSowPhase(state, playerId);
}

function finishSowPhase(state: GameState, playerId: string): void {
  const player = getPlayer(state, playerId);
  state.awaitingOptionalSow = false;
  state.phase = "trueque";
  log(state, `${player.name} termina la siembra y pasa a la fase de trueque.`);
}
