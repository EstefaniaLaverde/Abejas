import { ArraySchema, Schema, type } from "@colyseus/schema";
import { CardSchema } from "./CardSchema.js";
import { RequestedCardsSchema } from "./RequestedCardsSchema.js";

/** Oferta de trueque, siempre pública (todos deben poder verla y aceptarla). */
export class TradeOfferSchema extends Schema {
  @type("string") id = "";
  @type("string") fromPlayerId = "";
  @type([CardSchema]) offeredCards = new ArraySchema<CardSchema>();
  /** Puede incluir varios tipos de cultivo distintos. */
  @type([RequestedCardsSchema]) requestedCards = new ArraySchema<RequestedCardsSchema>();
  /** Si no está vacío, es un regalo dirigido a ese jugador específico. */
  @type("string") toPlayerId = "";
  @type("string") status: "pendiente" | "aceptada" | "rechazada" | "cancelada" = "pendiente";
}
