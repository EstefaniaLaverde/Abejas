import { describe, expect, it } from "vitest";
import { buildFullDeck, createInitialGameState } from "../src/deck.js";
import { TOTAL_CARDS_IN_DECK } from "../src/cardTypes.js";
import { createRng } from "../src/rng.js";

describe("buildFullDeck", () => {
  it("crea 150 cartas en total", () => {
    const deck = buildFullDeck();
    expect(deck.length).toBe(150);
    expect(TOTAL_CARDS_IN_DECK).toBe(150);
  });

  it("tiene ids únicos por carta", () => {
    const deck = buildFullDeck();
    const ids = new Set(deck.map((c) => c.id));
    expect(ids.size).toBe(deck.length);
  });
});

describe("createInitialGameState", () => {
  it("reparte 5 cartas a cada jugador y descuenta del mazo", () => {
    const state = createInitialGameState(["Ana", "Beto", "Caro"], { rng: createRng(1) });
    for (const player of state.players) {
      expect(player.hand.length).toBe(5);
    }
    expect(state.deck.length).toBe(150 - 5 * 3);
  });

  it("es determinista con el mismo seed", () => {
    const a = createInitialGameState(["Ana", "Beto"], { rng: createRng(42) });
    const b = createInitialGameState(["Ana", "Beto"], { rng: createRng(42) });
    expect(a.players[0]!.hand.map((c) => c.typeId)).toEqual(
      b.players[0]!.hand.map((c) => c.typeId),
    );
    expect(a.currentPlayerIndex).toBe(b.currentPlayerIndex);
  });

  it("rechaza menos de 2 o más de 6 jugadores", () => {
    expect(() => createInitialGameState(["Solo"])).toThrow();
    expect(() =>
      createInitialGameState(["1", "2", "3", "4", "5", "6", "7"]),
    ).toThrow();
  });

  it("respeta el jugador inicial cuando se especifica", () => {
    const state = createInitialGameState(["Ana", "Beto", "Caro"], {
      rng: createRng(7),
      startingPlayerIndex: 2,
    });
    expect(state.currentPlayerIndex).toBe(2);
  });
});
