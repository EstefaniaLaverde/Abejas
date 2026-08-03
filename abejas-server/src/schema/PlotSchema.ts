import { ArraySchema, Schema, type } from "@colyseus/schema";
import { CardSchema } from "./CardSchema.js";

/** Una parcela. Siempre pública: todos ven lo que cada jugador tiene sembrado. */
export class PlotSchema extends Schema {
  @type([CardSchema]) cards = new ArraySchema<CardSchema>();
}
