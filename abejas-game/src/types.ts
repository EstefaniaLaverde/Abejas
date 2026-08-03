/** Identificador de un tipo de cultivo (fruta/vegetal), ej. "papa-bandera". */
export type CardTypeId = string;

/** Un escalón de la tabla de conversión: con `count` cartas se obtienen `bees` abejas. */
export interface BeeThreshold {
  count: number;
  bees: number;
}

/** Definición estática de un tipo de cultivo. */
export interface CardType {
  id: CardTypeId;
  name: string;
  totalInDeck: number;
  /** Ordenado ascendentemente por `count`. */
  beeTable: BeeThreshold[];
}

/** Instancia de una carta física dentro del mazo/mano/parcela. */
export interface Card {
  id: string;
  typeId: CardTypeId;
}

/** Una de las tres parcelas de un jugador. Vacía cuando `cards` está vacío. */
export interface Plot {
  cards: Card[];
}

export interface Player {
  id: string;
  name: string;
  /** Mano ordenada: la carta en el índice 0 es la próxima a sembrar. */
  hand: Card[];
  plots: [Plot, Plot, Plot];
  bees: number;
}

export type GamePhase =
  | "siembra"
  | "trueque"
  | "toma"
  | "ronda-final-trueque"
  | "terminado";

export type DeckRound = "principal" | "compost";

/** De dónde salió una carta ofrecida en un trueque (afecta qué pasa si el trueque falla). */
export type TradeCardOrigin = "hand" | "drawn";

export interface OfferedCard {
  card: Card;
  origin: TradeCardOrigin;
}

/** Oferta de trueque activa, visible para todos los jugadores. */
export interface TradeOffer {
  id: string;
  fromPlayerId: string;
  /** Cartas que el jugador ofrece (de su mano o recién robadas). */
  offeredCards: OfferedCard[];
  /** Cartas que el jugador está pidiendo a cambio (por tipo y cantidad). */
  requestedTypeId: CardTypeId;
  requestedCount: number;
  status: "pendiente" | "aceptada" | "rechazada" | "cancelada";
}

/** Carta que un jugador recibió (por trueque) y debe sembrar obligatoriamente. */
export interface PendingMandatoryPlant {
  playerId: string;
  card: Card;
  reason: "trueque";
}

export interface GameState {
  players: Player[];
  /** Índice en `players` del jugador en turno. */
  currentPlayerIndex: number;
  phase: GamePhase;
  deck: Card[];
  compost: Card[];
  deckRound: DeckRound;
  /** true tras sembrar la carta obligatoria, mientras se decide la segunda (opcional). */
  awaitingOptionalSow: boolean;
  /** Cartas recién robadas en la fase de trueque, pendientes de jugarse. */
  pendingTradeDraw: Card[];
  tradeOffers: TradeOffer[];
  pendingMandatoryPlants: PendingMandatoryPlant[];
  /** true una vez se jugó la ronda final de trueques (post segunda ronda). */
  finalTradeRoundDone: boolean;
  winnerId: string | null;
  log: string[];
}
