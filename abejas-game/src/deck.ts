import { CARD_TYPES } from "./cardTypes.js";
import type { Card, GameState, Player } from "./types.js";
import { type Rng, defaultRng, shuffle } from "./rng.js";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;
const INITIAL_HAND_SIZE = 5;

let cardIdCounter = 0;
function nextCardId(typeId: string): string {
  cardIdCounter += 1;
  return `${typeId}-${cardIdCounter}`;
}

/** Construye el mazo completo sin barajar: 150 cartas según CARD_TYPES. */
export function buildFullDeck(): Card[] {
  const deck: Card[] = [];
  for (const type of CARD_TYPES) {
    for (let i = 0; i < type.totalInDeck; i++) {
      deck.push({ id: nextCardId(type.id), typeId: type.id });
    }
  }
  return deck;
}

export interface CreateGameOptions {
  rng?: Rng;
  /** Índice del jugador que empieza; si no se da, se elige al azar. */
  startingPlayerIndex?: number;
}

/**
 * Crea el estado inicial de una partida: baraja el mazo, reparte 5 cartas
 * por jugador (round-robin) y elige al azar quién empieza. El orden de
 * turno queda fijo según el orden de `playerNames` (avanza hacia la derecha).
 */
export function createInitialGameState(
  playerNames: string[],
  options: CreateGameOptions = {},
): GameState {
  if (playerNames.length < MIN_PLAYERS || playerNames.length > MAX_PLAYERS) {
    throw new Error(
      `Abejas se juega entre ${MIN_PLAYERS} y ${MAX_PLAYERS} jugadores (se dieron ${playerNames.length}).`,
    );
  }

  const rng = options.rng ?? defaultRng();
  const deck = shuffle(buildFullDeck(), rng);

  const players: Player[] = playerNames.map((name, index) => ({
    id: `p${index + 1}`,
    name,
    hand: [],
    plots: [{ cards: [] }, { cards: [] }, { cards: [] }],
    bees: 0,
  }));

  // Reparto round-robin de la mano inicial.
  for (let round = 0; round < INITIAL_HAND_SIZE; round++) {
    for (const player of players) {
      const card = deck.pop();
      if (!card) throw new Error("El mazo no tiene suficientes cartas para repartir.");
      player.hand.push(card);
    }
  }

  const startingPlayerIndex =
    options.startingPlayerIndex ?? Math.floor(rng() * players.length);

  return {
    players,
    currentPlayerIndex: startingPlayerIndex,
    phase: "siembra",
    deck,
    compost: [],
    deckRound: "principal",
    awaitingOptionalSow: false,
    pendingTradeDraw: [],
    tradeDrawnThisTurn: false,
    tradeOffers: [],
    pendingMandatoryPlants: [],
    finalTradeRoundDone: false,
    winnerId: null,
    log: [
      `Partida iniciada con ${players.length} jugadores. Empieza ${players[startingPlayerIndex]!.name}.`,
    ],
  };
}
