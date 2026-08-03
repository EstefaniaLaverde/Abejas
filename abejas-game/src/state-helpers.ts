import type { Card, GameState, Player } from "./types.js";
import { GameError } from "./errors.js";

export function getPlayer(state: GameState, playerId: string): Player {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new GameError(`Jugador desconocido: ${playerId}`);
  return player;
}

export function getCurrentPlayer(state: GameState): Player {
  const player = state.players[state.currentPlayerIndex];
  if (!player) throw new GameError("No hay jugador en turno.");
  return player;
}

export function assertIsCurrentPlayer(state: GameState, playerId: string): void {
  const current = getCurrentPlayer(state);
  if (current.id !== playerId) {
    throw new GameError(
      `No es el turno de ${playerId}, es el turno de ${current.id}.`,
    );
  }
}

export function assertPhase(state: GameState, ...phases: GameState["phase"][]): void {
  if (!phases.includes(state.phase)) {
    throw new GameError(
      `Acción inválida en fase "${state.phase}" (se esperaba: ${phases.join(", ")}).`,
    );
  }
}

/** Quita y devuelve la carta con `cardId` de la mano del jugador. */
export function removeFromHand(player: Player, cardId: string): Card {
  const index = player.hand.findIndex((c) => c.id === cardId);
  if (index === -1) {
    throw new GameError(`El jugador ${player.id} no tiene la carta ${cardId} en mano.`);
  }
  const [card] = player.hand.splice(index, 1);
  return card!;
}

export function log(state: GameState, message: string): void {
  state.log.push(message);
}

/**
 * Índices de parcelas donde `typeId` se puede sembrar sin necesidad de
 * descartar: vacías o que ya tengan ese mismo cultivo.
 */
export function validPlotIndexesForType(player: Player, typeId: string): number[] {
  const valid: number[] = [];
  player.plots.forEach((plot, index) => {
    const isEmpty = plot.cards.length === 0;
    const matchesType = plot.cards[0]?.typeId === typeId;
    if (isEmpty || matchesType) valid.push(index);
  });
  return valid;
}

export function canPlantWithoutDiscard(player: Player, typeId: string): boolean {
  return validPlotIndexesForType(player, typeId).length > 0;
}

/**
 * Siembra una carta específica en una parcela. Si la parcela no está vacía
 * ni tiene el mismo cultivo, se descarta primero (solo permitido si el
 * jugador no tiene ninguna parcela vacía o con el mismo cultivo disponible),
 * salvo que `force` sea true.
 *
 * `force` se usa para la siembra obligatoria de cartas recibidas por
 * trueque: al ser una siembra forzada por el intercambio, el jugador puede
 * elegir descartar cualquiera de sus 3 parcelas aunque tenga una vacía o con
 * el mismo cultivo disponible.
 */
export function plantCard(
  state: GameState,
  player: Player,
  card: Card,
  targetPlotIndex: number,
  force = false,
): void {
  const plot = player.plots[targetPlotIndex];
  if (!plot) throw new GameError(`Parcela inválida: ${targetPlotIndex}`);

  const isEmpty = plot.cards.length === 0;
  const matchesType = plot.cards[0]?.typeId === card.typeId;
  const canPlantDirectly = isEmpty || matchesType;
  const hasValidAlternative = force ? false : canPlantWithoutDiscard(player, card.typeId);

  if (!canPlantDirectly) {
    if (hasValidAlternative) {
      throw new GameError(
        `${player.id} debe usar una parcela vacía o con el mismo cultivo antes de descartar otra.`,
      );
    }
    const discarded = plot.cards.splice(0, plot.cards.length);
    state.compost.push(...discarded);
    log(
      state,
      `${player.name} descarta la parcela ${targetPlotIndex} (${discarded.length} cartas) para poder sembrar.`,
    );
  }

  plot.cards.push(card);
}
