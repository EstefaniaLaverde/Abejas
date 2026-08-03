import { ArraySchema, Schema, type } from "@colyseus/schema";
import { CardSchema } from "./CardSchema.js";

/** Oferta de trueque, siempre pública (todos deben poder verla y aceptarla). */
export class TradeOfferSchema extends Schema {
  @type("string") id = "";
  @type("string") fromPlayerId = "";
  @type([CardSchema]) offeredCards = new ArraySchema<CardSchema>();
  @type("string") requestedTypeId = "";
  @type("number") requestedCount = 0;
  @type("string") status: "pendiente" | "aceptada" | "rechazada" | "cancelada" = "pendiente";
}
