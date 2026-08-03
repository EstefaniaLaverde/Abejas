import type {
  Card,
  GameState,
  Player,
  Plot,
  RequestedCards,
  TradeOffer,
  PendingMandatoryPlant,
} from "@abejas/game";
import { ArraySchema, Schema } from "@colyseus/schema";
import { AbejasState } from "./schema/AbejasState.js";
import { CardSchema } from "./schema/CardSchema.js";
import { PlayerSchema } from "./schema/PlayerSchema.js";
import { PlotSchema } from "./schema/PlotSchema.js";
import { TradeOfferSchema } from "./schema/TradeOfferSchema.js";
import { RequestedCardsSchema } from "./schema/RequestedCardsSchema.js";
import { PendingMandatoryPlantSchema } from "./schema/PendingMandatoryPlantSchema.js";

/**
 * Sincroniza `arr` (ArraySchema) para que tenga el mismo contenido que
 * `sources`, reutilizando y mutando las instancias existentes en vez de
 * reemplazarlas. Esto es importante por dos razones:
 * 1. `StateView` (privacidad de la mano) depende de la identidad estable de
 *    las instancias de `PlayerSchema` — si las reemplazáramos en cada sync,
 *    la visibilidad configurada en `onJoin` se perdería.
 * 2. Genera menos ruido de red: solo se serializan los campos que cambiaron.
 */
function syncList<Source, Target extends Schema>(
  arr: ArraySchema<Target>,
  sources: Source[],
  updateOrCreate: (source: Source, existing: Target | undefined) => Target,
): void {
  for (let i = 0; i < sources.length; i++) {
    const existing = i < arr.length ? arr[i] : undefined;
    const updated = updateOrCreate(sources[i]!, existing);
    if (existing !== updated) {
      if (i < arr.length) {
        arr[i] = updated;
      } else {
        arr.push(updated);
      }
    }
  }
  while (arr.length > sources.length) {
    arr.pop();
  }
}

function updateCard(card: Card, existing: CardSchema | undefined): CardSchema {
  const schema = existing ?? new CardSchema();
  schema.id = card.id;
  schema.typeId = card.typeId;
  return schema;
}

function updatePlot(plot: Plot, existing: PlotSchema | undefined): PlotSchema {
  const schema = existing ?? new PlotSchema();
  syncList(schema.cards, plot.cards, updateCard);
  return schema;
}

function updateRequestedCards(
  requested: RequestedCards,
  existing: RequestedCardsSchema | undefined,
): RequestedCardsSchema {
  const schema = existing ?? new RequestedCardsSchema();
  schema.typeId = requested.typeId;
  schema.count = requested.count;
  return schema;
}

function updateTradeOffer(offer: TradeOffer, existing: TradeOfferSchema | undefined): TradeOfferSchema {
  const schema = existing ?? new TradeOfferSchema();
  schema.id = offer.id;
  schema.fromPlayerId = offer.fromPlayerId;
  schema.toPlayerId = offer.toPlayerId ?? "";
  schema.status = offer.status;
  syncList(
    schema.offeredCards,
    offer.offeredCards.map((o) => o.card),
    updateCard,
  );
  syncList(schema.requestedCards, offer.requestedCards, updateRequestedCards);
  return schema;
}

function updatePendingPlant(
  pending: PendingMandatoryPlant,
  existing: PendingMandatoryPlantSchema | undefined,
): PendingMandatoryPlantSchema {
  const schema = existing ?? new PendingMandatoryPlantSchema();
  schema.playerId = pending.playerId;
  schema.card = updateCard(pending.card, schema.card);
  return schema;
}

/**
 * Reconstruye el `AbejasState` (red) a partir del `GameState` (motor de
 * reglas), mutando en el lugar. Se llama después de cada acción válida.
 */
export function syncStateFromEngine(
  engineState: GameState,
  schema: AbejasState,
  sessionIdByPlayerId: Map<string, string>,
): void {
  schema.currentPlayerIndex = engineState.currentPlayerIndex;
  schema.phase = engineState.phase;
  schema.deckCount = engineState.deck.length;
  schema.deckRound = engineState.deckRound;
  schema.awaitingOptionalSow = engineState.awaitingOptionalSow;
  schema.tradeDrawnThisTurn = engineState.tradeDrawnThisTurn;
  schema.finalTradeRoundDone = engineState.finalTradeRoundDone;
  schema.winnerId = engineState.winnerId ?? "";

  syncList(schema.compost, engineState.compost, updateCard);
  syncList(schema.pendingTradeDraw, engineState.pendingTradeDraw, updateCard);
  syncList(schema.tradeOffers, engineState.tradeOffers, updateTradeOffer);
  syncList(schema.pendingMandatoryPlants, engineState.pendingMandatoryPlants, updatePendingPlant);

  syncList(schema.players, engineState.players, (player: Player, existing: PlayerSchema | undefined) => {
    const playerSchema = existing ?? new PlayerSchema();
    playerSchema.sessionId = sessionIdByPlayerId.get(player.id) ?? "";
    playerSchema.playerId = player.id;
    playerSchema.name = player.name;
    playerSchema.bees = player.bees;
    playerSchema.handCount = player.hand.length;
    syncList(playerSchema.hand, player.hand, updateCard);
    syncList(playerSchema.plots, player.plots, updatePlot);
    return playerSchema;
  });

  // El log del motor es de solo-append (nunca se reordena ni se recorta),
  // así que basta con empujar las entradas nuevas. `ArraySchema#splice()`
  // no admite insertar más elementos de los que borra, así que no se puede
  // usar aquí para un reemplazo masivo.
  while (schema.log.length < engineState.log.length) {
    schema.log.push(engineState.log[schema.log.length]!);
  }
}
