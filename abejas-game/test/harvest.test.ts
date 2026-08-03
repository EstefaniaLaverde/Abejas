import { describe, expect, it, beforeEach } from "vitest";
import { createInitialGameState } from "../src/deck.js";
import { createRng } from "../src/rng.js";
import { harvestPlot } from "../src/harvest.js";
import type { GameState } from "../src/types.js";

function makeCards(typeId: string, count: number, prefix = "c") {
  return Array.from({ length: count }, (_, i) => ({ id: `${prefix}${i}`, typeId }));
}

let state: GameState;

beforeEach(() => {
  state = createInitialGameState(["Ana", "Beto"], { rng: createRng(1) });
});

describe("harvestPlot", () => {
  it("con 8 papas bandera (umbral 7 -> 2 abejas) se queda 2 y pierde el resto (6) al compost", () => {
    const player = state.players[0]!;
    player.plots[0]!.cards = makeCards("papa-bandera", 8);
    const result = harvestPlot(state, player.id, 0);
    expect(result.beesGained).toBe(2);
    expect(result.cardsLostToCompost).toBe(6);
    expect(player.bees).toBe(2);
    expect(player.plots[0]!.cards.length).toBe(0);
    expect(state.compost.length).toBe(6);
  });

  it("si no alcanza el mínimo, se pierde toda la parcela sin abejas", () => {
    const player = state.players[0]!;
    player.plots[0]!.cards = makeCards("papa-bandera", 3); // mínimo es 4
    const result = harvestPlot(state, player.id, 0);
    expect(result.beesGained).toBe(0);
    expect(result.cardsLostToCompost).toBe(3);
    expect(player.bees).toBe(0);
    expect(state.compost.length).toBe(3);
  });

  it("capuchina con 2 cartas da 2 abejas directo (no hay escalón de 1 abeja)", () => {
    const player = state.players[0]!;
    player.plots[0]!.cards = makeCards("capuchina", 2);
    const result = harvestPlot(state, player.id, 0);
    expect(result.beesGained).toBe(2);
    expect(result.cardsLostToCompost).toBe(0);
  });

  it("se puede cosechar en cualquier momento, sin importar de quién es el turno", () => {
    const otherPlayer = state.players[1]!;
    otherPlayer.plots[0]!.cards = makeCards("chachafruto", 2);
    // el turno es de state.players[0], pero el otro jugador puede cosechar igual
    expect(() => harvestPlot(state, otherPlayer.id, 0)).not.toThrow();
  });

  it("falla si la parcela está vacía", () => {
    const player = state.players[0]!;
    expect(() => harvestPlot(state, player.id, 0)).toThrow();
  });
});
