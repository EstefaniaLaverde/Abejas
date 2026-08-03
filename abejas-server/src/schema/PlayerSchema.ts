import { ArraySchema, Schema, type, view } from "@colyseus/schema";
import { CardSchema } from "./CardSchema.js";
import { PlotSchema } from "./PlotSchema.js";

export class PlayerSchema extends Schema {
  /** sessionId de Colyseus (conexión de red), puede cambiar al reconectar. */
  @type("string") sessionId = "";
  /** id estable del motor de reglas (p1, p2, ...), no cambia en toda la partida. */
  @type("string") playerId = "";
  @type("string") name = "";
  @type("boolean") connected = true;
  @type("number") bees = 0;
  @type([PlotSchema]) plots = new ArraySchema<PlotSchema>();

  /**
   * La mano es información privada: solo visible para el propio jugador.
   * Se hace pública vía `client.view.add(playerSchema)` únicamente para su dueño.
   */
  @view() @type([CardSchema]) hand = new ArraySchema<CardSchema>();

  /** Cantidad de cartas en mano, sí es pública (importa para el desempate final). */
  @type("number") handCount = 0;
}
