import { ArraySchema, Schema, type } from "@colyseus/schema";
import { CardSchema } from "./CardSchema.js";
import { PlayerSchema } from "./PlayerSchema.js";
import { TradeOfferSchema } from "./TradeOfferSchema.js";
import { PendingMandatoryPlantSchema } from "./PendingMandatoryPlantSchema.js";

export class AbejasState extends Schema {
  @type([PlayerSchema]) players = new ArraySchema<PlayerSchema>();
  @type("number") currentPlayerIndex = 0;
  @type("string") phase = "esperando";

  /** El contenido del mazo nunca se sincroniza (es información oculta); solo el conteo. */
  @type("number") deckCount = 0;
  @type("string") deckRound: "principal" | "compost" = "principal";

  /** El compost es público: cualquiera puede ver qué se ha perdido. */
  @type([CardSchema]) compost = new ArraySchema<CardSchema>();

  @type("boolean") awaitingOptionalSow = false;

  /** Cartas robadas para el trueque, boca arriba: públicas. */
  @type([CardSchema]) pendingTradeDraw = new ArraySchema<CardSchema>();
  /** true si el jugador en turno ya robó sus cartas de trueque este turno. */
  @type("boolean") tradeDrawnThisTurn = false;

  @type([TradeOfferSchema]) tradeOffers = new ArraySchema<TradeOfferSchema>();
  @type([PendingMandatoryPlantSchema]) pendingMandatoryPlants = new ArraySchema<PendingMandatoryPlantSchema>();

  @type("boolean") finalTradeRoundDone = false;
  @type("string") winnerId = "";

  @type(["string"]) log = new ArraySchema<string>();
}
