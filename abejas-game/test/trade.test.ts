import { describe, expect, it, beforeEach } from "vitest";
import { createInitialGameState } from "../src/deck.js";
import { createRng } from "../src/rng.js";
import { sowMandatoryCard, skipOptionalSow } from "../src/sow.js";
import {
  drawTradeCards,
  proposeTrade,
  acceptTrade,
  cancelTrade,
  plantMandatoryTradeCard,
  finishTradePhase,
  plantDrawnCard,
} from "../src/trade.js";
import type { GameState } from "../src/types.js";

function makeCard(typeId: string, id: string) {
  return { id, typeId };
}

let state: GameState;
let currentId: string;
let otherId: string;

function advanceToTrueque() {
  const player = state.players[state.currentPlayerIndex]!;
  player.hand = [makeCard("lulo", "sow1")];
  sowMandatoryCard(state, currentId, 0);
  skipOptionalSow(state, currentId);
}

beforeEach(() => {
  state = createInitialGameState(["Ana", "Beto"], { rng: createRng(3), startingPlayerIndex: 0 });
  currentId = state.players[0]!.id;
  otherId = state.players[1]!.id;
  advanceToTrueque();
});

describe("trueque", () => {
  it("un jugador puede plantar directamente las cartas robadas si le sirven", () => {
    drawTradeCards(state, currentId);
    expect(state.pendingTradeDraw.length).toBe(2);
    const [c1, c2] = state.pendingTradeDraw;
    plantDrawnCard(state, currentId, c1!.id, 0);
    plantDrawnCard(state, currentId, c2!.id, 1);
    expect(state.pendingTradeDraw.length).toBe(0);
    finishTradePhase(state, currentId);
    expect(state.phase).toBe("toma");
  });

  it("no se puede terminar el trueque con cartas robadas sin jugar", () => {
    drawTradeCards(state, currentId);
    expect(() => finishTradePhase(state, currentId)).toThrow();
  });

  it("una oferta aceptada obliga a ambos a sembrar lo recibido", () => {
    drawTradeCards(state, currentId);
    const drawnCard = state.pendingTradeDraw[0]!;
    const other = state.players.find((p) => p.id === otherId)!;
    other.hand.push(makeCard("coca", "req1"), makeCard("coca", "req2"));

    const offer = proposeTrade(state, currentId, [drawnCard.id], "coca", 2);
    expect(state.pendingTradeDraw.length).toBe(1); // la otra carta robada sigue pendiente

    acceptTrade(state, offer.id, otherId);
    expect(state.pendingMandatoryPlants.length).toBe(3); // 1 ofrecida + 2 pedidas

    // El resto de las cartas robadas todavía deben jugarse (plot 0 ya tiene
    // lulo sembrado por advanceToTrueque, así que se usa una parcela vacía).
    const remainingDrawn = state.pendingTradeDraw[0]!;
    const currentPlayer = state.players.find((p) => p.id === currentId)!;
    const validIndex = currentPlayer.plots.findIndex(
      (p) => p.cards.length === 0 || p.cards[0]?.typeId === remainingDrawn.typeId,
    );
    plantDrawnCard(state, currentId, remainingDrawn.id, validIndex);

    // Resolver las siembras obligatorias del trueque.
    for (const pending of [...state.pendingMandatoryPlants]) {
      const player = state.players.find((p) => p.id === pending.playerId)!;
      const emptyOrMatch = player.plots.findIndex(
        (p) => p.cards.length === 0 || p.cards[0]?.typeId === pending.card.typeId,
      );
      plantMandatoryTradeCard(state, pending.playerId, pending.card.id, emptyOrMatch === -1 ? 0 : emptyOrMatch);
    }
    expect(state.pendingMandatoryPlants.length).toBe(0);

    finishTradePhase(state, currentId);
    expect(state.phase).toBe("toma");
  });

  it("si se cancela una oferta, las cartas robadas vuelven a estar pendientes de siembra", () => {
    drawTradeCards(state, currentId);
    const drawnCard = state.pendingTradeDraw[0]!;
    const offer = proposeTrade(state, currentId, [drawnCard.id], "coca", 5);
    expect(state.pendingTradeDraw.length).toBe(1);

    cancelTrade(state, offer.id, currentId);
    expect(state.pendingTradeDraw.length).toBe(2);
    expect(state.pendingTradeDraw.find((c) => c.id === drawnCard.id)).toBeDefined();
  });

  it("solo quien propuso la oferta puede cancelarla", () => {
    drawTradeCards(state, currentId);
    const drawnCard = state.pendingTradeDraw[0]!;
    const offer = proposeTrade(state, currentId, [drawnCard.id], "coca", 5);
    expect(() => cancelTrade(state, offer.id, otherId)).toThrow();
  });

  it("las cartas de mano ofrecidas y rechazadas vuelven a la mano (no a lo pendiente de robo)", () => {
    const player = state.players[0]!;
    player.hand.push(makeCard("achiote", "handcard"));
    drawTradeCards(state, currentId);
    const offer = proposeTrade(state, currentId, ["handcard"], "coca", 5);
    expect(player.hand.find((c) => c.id === "handcard")).toBeUndefined();

    cancelTrade(state, offer.id, currentId);
    expect(player.hand.find((c) => c.id === "handcard")).toBeDefined();
    expect(state.pendingTradeDraw.find((c) => c.id === "handcard")).toBeUndefined();
  });
});
