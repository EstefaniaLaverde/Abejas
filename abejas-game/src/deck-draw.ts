import type { Card, GameState } from "./types.js";
import { defaultRng, shuffle } from "./rng.js";
import { log } from "./state-helpers.js";

export interface DrawResult {
  cards: Card[];
  /** true si no había suficientes cartas ni en el mazo ni en el compost. */
  exhausted: boolean;
}

/**
 * Roba `count` cartas del mazo. Si el mazo principal se agota, se baraja el
 * compost y se convierte en el mazo de la segunda ronda (esto solo ocurre
 * una vez). Si también se agota la segunda ronda, devuelve lo que se pudo
 * robar (puede ser menos de `count`, incluso 0) con `exhausted: true`.
 */
export function drawCardsWithRoundTransition(state: GameState, count: number): DrawResult {
  const cards: Card[] = [];

  while (cards.length < count) {
    if (state.deck.length === 0) {
      if (state.deckRound === "principal" && state.compost.length > 0) {
        log(
          state,
          `Se agota el mazo principal. Se baraja el compost (${state.compost.length} cartas) para la segunda ronda.`,
        );
        state.deck = shuffle(state.compost, defaultRng());
        state.compost = [];
        state.deckRound = "compost";
        continue;
      }
      return { cards, exhausted: true };
    }
    cards.push(state.deck.pop()!);
  }

  return { cards, exhausted: false };
}
