import { Schema, type } from "@colyseus/schema";

/** Espejo de red de `Card` del motor (`@abejas/game`). */
export class CardSchema extends Schema {
  @type("string") id = "";
  @type("string") typeId = "";
}
