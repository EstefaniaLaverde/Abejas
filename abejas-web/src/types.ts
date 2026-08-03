/**
 * Espejo en TypeScript plano de `AbejasState.toJSON()` (ver
 * abejas-server/src/schema/*). Se usa `room.onStateChange` +
 * `state.toJSON()` en vez de los callbacks finos de Colyseus: es más
 * simple y de todas formas el estado de Abejas no es tan grande como para
 * necesitar diffing manual en el cliente.
 */

export interface CardJSON {
  id: string;
  typeId: string;
}

export interface PlotJSON {
  cards: CardJSON[];
}

export interface PlayerJSON {
  sessionId: string;
  playerId: string;
  name: string;
  connected: boolean;
  bees: number;
  plots: PlotJSON[];
  /** Solo presente para el dueño de la mano (StateView oculta el resto). */
  hand?: CardJSON[];
  handCount: number;
}

export type TradeOfferStatus = "pendiente" | "aceptada" | "rechazada" | "cancelada";

export interface RequestedCardsJSON {
  typeId: string;
  count: number;
}

export interface TradeOfferJSON {
  id: string;
  fromPlayerId: string;
  offeredCards: CardJSON[];
  /** Puede incluir varios tipos de cultivo distintos. */
  requestedCards: RequestedCardsJSON[];
  /** Si no está vacío, es un regalo dirigido a ese jugador específico. */
  toPlayerId: string;
  status: TradeOfferStatus;
}

export interface PendingMandatoryPlantJSON {
  playerId: string;
  card: CardJSON;
}

export type GamePhase =
  | "esperando"
  | "siembra"
  | "trueque"
  | "toma"
  | "ronda-final-trueque"
  | "terminado";

export interface AbejasStateJSON {
  players: PlayerJSON[];
  currentPlayerIndex: number;
  phase: GamePhase;
  deckCount: number;
  deckRound: "principal" | "compost";
  compost: CardJSON[];
  awaitingOptionalSow: boolean;
  pendingTradeDraw: CardJSON[];
  tradeDrawnThisTurn: boolean;
  tradeOffers: TradeOfferJSON[];
  pendingMandatoryPlants: PendingMandatoryPlantJSON[];
  finalTradeRoundDone: boolean;
  winnerId: string;
  log: string[];
}
