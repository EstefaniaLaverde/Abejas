import type { GameState } from "./types.js";
import { GameError } from "./errors.js";
import { highestReachedThreshold } from "./cardTypes.js";
import { getPlayer, log } from "./state-helpers.js";

export interface HarvestResult {
  beesGained: number;
  cardsLostToCompost: number;
}

/**
 * Cosecha una parcela. Disponible para cualquier jugador en cualquier
 * momento de la partida (no está restringido al turno propio ni a una fase).
 *
 * Se toma el mayor escalón de abejas alcanzado por la cantidad de cartas en
 * la parcela: el jugador se queda con tantas cartas como abejas obtenga, y
 * el resto va al compost. Si no se alcanza el mínimo de ningún escalón, se
 * pierde toda la parcela (0 abejas, todas las cartas al compost).
 */
export function harvestPlot(
  state: GameState,
  playerId: string,
  plotIndex: number,
): HarvestResult {
  if (state.phase === "terminado") {
    throw new GameError("La partida ya terminó, no se puede cosechar.");
  }
  const player = getPlayer(state, playerId);
  const plot = player.plots[plotIndex];
  if (!plot) throw new GameError(`Parcela inválida: ${plotIndex}`);
  if (plot.cards.length === 0) {
    throw new GameError(`La parcela ${plotIndex} de ${player.id} está vacía.`);
  }

  const typeId = plot.cards[0]!.typeId;
  const cardCount = plot.cards.length;
  const reached = highestReachedThreshold(typeId, cardCount);

  const beesGained = reached?.bees ?? 0;
  plot.cards.splice(0, beesGained); // cartas que el jugador se queda como abejas
  const lostCards = plot.cards.splice(0, plot.cards.length);

  player.bees += beesGained;
  state.compost.push(...lostCards);

  if (beesGained > 0) {
    log(
      state,
      `${player.name} cosecha la parcela ${plotIndex} (${typeId}): obtiene ${beesGained} abejas, pierde ${lostCards.length} cartas al compost.`,
    );
  } else {
    log(
      state,
      `${player.name} cosecha la parcela ${plotIndex} (${typeId}) sin alcanzar el mínimo: pierde toda la parcela (${lostCards.length} cartas).`,
    );
  }

  return { beesGained, cardsLostToCompost: lostCards.length };
}
