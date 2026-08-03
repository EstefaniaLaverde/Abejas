import { describe, expect, it, beforeEach } from "vitest";
import { createInitialGameState } from "../src/deck.js";
import { createRng } from "../src/rng.js";
import { sowMandatoryCard, sowOptionalCard, skipOptionalSow } from "../src/sow.js";
import type { GameState } from "../src/types.js";

function makeCard(typeId: string, id: string) {
  return { id, typeId };
}

let state: GameState;
let playerId: string;

beforeEach(() => {
  state = createInitialGameState(["Ana", "Beto"], { rng: createRng(1), startingPlayerIndex: 0 });
  playerId = state.players[0]!.id;
});

describe("sowMandatoryCard", () => {
  it("planta en una parcela vacía si el jugador no tiene el cultivo en ninguna otra", () => {
    const player = state.players[0]!;
    player.hand = [makeCard("lulo", "c1")];
    sowMandatoryCard(state, playerId, 0);
    expect(player.plots[0]!.cards.map((c) => c.id)).toEqual(["c1"]);
    expect(player.hand.length).toBe(0);
    expect(state.awaitingOptionalSow).toBe(true);
  });

  it("permite apilar en la parcela con el mismo cultivo aunque haya una vacía", () => {
    const player = state.players[0]!;
    player.plots[1]!.cards = [makeCard("lulo", "existing")];
    player.hand = [makeCard("lulo", "c2")];
    // parcela 0 está vacía, pero el jugador elige apilar en la 1 (mismo cultivo)
    sowMandatoryCard(state, playerId, 1);
    expect(player.plots[1]!.cards.map((c) => c.id)).toEqual(["existing", "c2"]);
    expect(player.plots[0]!.cards.length).toBe(0);
  });

  it("obliga a descartar una parcela cuando las tres están ocupadas por otros cultivos", () => {
    const player = state.players[0]!;
    player.plots[0]!.cards = [makeCard("lulo", "a1"), makeCard("lulo", "a2")];
    player.plots[1]!.cards = [makeCard("coca", "b1")];
    player.plots[2]!.cards = [makeCard("chontaduro", "c1")];
    player.hand = [makeCard("achiote", "new1")];

    sowMandatoryCard(state, playerId, 1); // descarta la parcela de coca
    expect(player.plots[1]!.cards.map((c) => c.id)).toEqual(["new1"]);
    expect(state.compost.map((c) => c.id)).toContain("b1");
  });

  it("rechaza descartar una parcela si hay una alternativa válida", () => {
    const player = state.players[0]!;
    player.plots[0]!.cards = []; // vacía: alternativa válida
    player.plots[1]!.cards = [makeCard("coca", "b1")];
    player.plots[2]!.cards = [makeCard("chontaduro", "c1")];
    player.hand = [makeCard("achiote", "new1")];

    expect(() => sowMandatoryCard(state, playerId, 1)).toThrow();
  });

  it("no permite sembrar fuera de turno", () => {
    const other = state.players[1]!.id;
    state.players[1]!.hand = [makeCard("lulo", "x1")];
    expect(() => sowMandatoryCard(state, other, 0)).toThrow();
  });
});

describe("segunda carta opcional", () => {
  it("puede omitirse", () => {
    const player = state.players[0]!;
    player.hand = [makeCard("lulo", "c1"), makeCard("coca", "c2")];
    sowMandatoryCard(state, playerId, 0);
    skipOptionalSow(state, playerId);
    expect(player.hand.map((c) => c.id)).toEqual(["c2"]);
    expect(state.phase).toBe("trueque");
  });

  it("puede sembrarse si el jugador quiere", () => {
    const player = state.players[0]!;
    player.hand = [makeCard("lulo", "c1"), makeCard("coca", "c2")];
    sowMandatoryCard(state, playerId, 0);
    sowOptionalCard(state, playerId, 1);
    expect(player.plots[1]!.cards.map((c) => c.id)).toEqual(["c2"]);
    expect(player.hand.length).toBe(0);
    expect(state.phase).toBe("trueque");
  });
});
