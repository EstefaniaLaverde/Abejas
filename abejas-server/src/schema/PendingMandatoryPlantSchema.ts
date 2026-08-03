import { Schema, type } from "@colyseus/schema";
import { CardSchema } from "./CardSchema.js";

/** Carta que un jugador recibió por trueque y debe sembrar obligatoriamente. */
export class PendingMandatoryPlantSchema extends Schema {
  @type("string") playerId = "";
  @type(CardSchema) card = new CardSchema();
}
