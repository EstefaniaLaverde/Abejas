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

    const offer = proposeTrade(state, currentId, [drawnCard.id], [{ typeId: "coca", count: 2 }]);
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
    const offer = proposeTrade(state, currentId, [drawnCard.id], [{ typeId: "coca", count: 5 }]);
    expect(state.pendingTradeDraw.length).toBe(1);

    cancelTrade(state, offer.id, currentId);
    expect(state.pendingTradeDraw.length).toBe(2);
    expect(state.pendingTradeDraw.find((c) => c.id === drawnCard.id)).toBeDefined();
  });

  it("solo quien propuso la oferta puede cancelarla", () => {
    drawTradeCards(state, currentId);
    const drawnCard = state.pendingTradeDraw[0]!;
    const offer = proposeTrade(state, currentId, [drawnCard.id], [{ typeId: "coca", count: 5 }]);
    expect(() => cancelTrade(state, offer.id, otherId)).toThrow();
  });

  it("las cartas de mano ofrecidas y rechazadas vuelven a la mano (no a lo pendiente de robo)", () => {
    const player = state.players[0]!;
    player.hand.push(makeCard("achiote", "handcard"));
    drawTradeCards(state, currentId);
    const offer = proposeTrade(state, currentId, ["handcard"], [{ typeId: "coca", count: 5 }]);
    expect(player.hand.find((c) => c.id === "handcard")).toBeUndefined();

    cancelTrade(state, offer.id, currentId);
    expect(player.hand.find((c) => c.id === "handcard")).toBeDefined();
    expect(state.pendingTradeDraw.find((c) => c.id === "handcard")).toBeUndefined();
  });

  it("se pueden ofrecer y pedir varios tipos de cultivo distintos en una misma oferta", () => {
    const player = state.players[0]!;
    player.hand.push(makeCard("chachafruto", "off1"), makeCard("papa-bandera", "off2"));
    const other = state.players.find((p) => p.id === otherId)!;
    // Se reemplaza la mano por completo (en vez de agregar) para que no
    // haya otra carta del mismo tipo repartida al azar que el motor pueda
    // elegir en lugar de la que estamos probando.
    other.hand = [makeCard("lulo", "req1"), makeCard("achiote", "req2")];

    const offer = proposeTrade(state, currentId, ["off1", "off2"], [
      { typeId: "lulo", count: 1 },
      { typeId: "achiote", count: 1 },
    ]);
    expect(offer.requestedCards).toEqual([
      { typeId: "lulo", count: 1 },
      { typeId: "achiote", count: 1 },
    ]);

    acceptTrade(state, offer.id, otherId);
    expect(other.hand.find((c) => c.id === "req1")).toBeUndefined();
    expect(other.hand.find((c) => c.id === "req2")).toBeUndefined();
    expect(state.pendingMandatoryPlants.length).toBe(4); // 2 ofrecidas + 2 pedidas
  });

  it("la siembra obligatoria de una carta recibida por trueque permite descartar cualquier parcela", () => {
    // Ambos jugadores empiezan con la parcela 0 ocupada (lulo) y las
    // parcelas 1 y 2 vacías gracias a advanceToTrueque(). Llenamos también
    // la 1 y la 2 con otros cultivos para simular que el jugador tiene
    // alternativas válidas (vacías/coincidentes) y aun así debe poder
    // elegir descartar la parcela 0.
    const player = state.players.find((p) => p.id === currentId)!;
    player.plots[1]!.cards.push(makeCard("coca", "p1"));
    player.plots[2]!.cards.push(makeCard("maiz-morado", "p2"));
    // Ninguna parcela vacía ni coincide con "yuca-brava": normalmente esto
    // ya sería válido sin `force`, así que en cambio dejamos una parcela
    // vacía disponible para probar que `force` la ignora.
    player.plots[2]!.cards = [];

    state.pendingMandatoryPlants.push({
      playerId: currentId,
      card: makeCard("yuca-brava", "trade1"),
      reason: "trueque",
    });

    // Con la regla normal esto lanzaría error porque la parcela 2 está vacía
    // (alternativa válida); con `force` debe permitirse descartar la 0.
    expect(() => plantMandatoryTradeCard(state, currentId, "trade1", 0)).not.toThrow();
    expect(player.plots[0]!.cards).toEqual([makeCard("yuca-brava", "trade1")]);
  });

  it("no se puede volver a robar cartas de trueque en el mismo turno aunque ya se hayan jugado todas", () => {
    drawTradeCards(state, currentId);
    const [c1, c2] = state.pendingTradeDraw;
    plantDrawnCard(state, currentId, c1!.id, 1);
    plantDrawnCard(state, currentId, c2!.id, 2);
    expect(state.pendingTradeDraw.length).toBe(0);
    expect(() => drawTradeCards(state, currentId)).toThrow();
  });
});
