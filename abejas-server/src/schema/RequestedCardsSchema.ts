import { Schema, type } from "@colyseus/schema";

/** Un tipo de cultivo y cuántas cartas de ese tipo se piden en un trueque. */
export class RequestedCardsSchema extends Schema {
  @type("string") typeId = "";
  @type("number") count = 0;
}
