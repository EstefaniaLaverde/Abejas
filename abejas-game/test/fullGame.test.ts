import { describe, expect, it } from "vitest";
import { createInitialGameState } from "../src/deck.js";
import { createRng } from "../src/rng.js";
import { endFinalTradeRoundAndFinishGame } from "../src/endgame.js";
import { playAutomatedTurn, countAllCards } from "./testUtils.js";
import type { GameState } from "../src/types.js";

function runFullGame(state: GameState, maxTurns = 2000): GameState {
  let turns = 0;
  while (state.phase !== "ronda-final-trueque" && state.phase !== "terminado") {
    const playerId = state.players[state.currentPlayerIndex]!.id;
    playAutomatedTurn(state, playerId);
    turns += 1;
    if (turns > maxTurns) {
      throw new Error("La partida no terminó dentro del límite de turnos (posible bug de motor).");
    }
  }
  if (state.phase === "ronda-final-trueque") {
    // El bot no propone trueques finales, así que se puede cerrar directo.
    endFinalTradeRoundAndFinishGame(state);
  }
  return state;
}

describe("partida completa de punta a punta", () => {
  it("termina, conserva las 150 cartas y asigna un ganador (seed 1, 3 jugadores)", () => {
    const state = createInitialGameState(["Ana", "Beto", "Caro"], {
      rng: createRng(1),
      startingPlayerIndex: 0,
    });
    const finished = runFullGame(state);

    expect(finished.phase).toBe("terminado");
    expect(finished.winnerId).not.toBeNull();
    expect(finished.deckRound).toBe("compost"); // pasó por la segunda ronda
    expect(countAllCards(finished)).toBe(150);
  });

  it("es reproducible: mismo seed produce el mismo ganador", () => {
    const s1 = runFullGame(
      createInitialGameState(["Ana", "Beto", "Caro"], { rng: createRng(99), startingPlayerIndex: 0 }),
    );
    const s2 = runFullGame(
      createInitialGameState(["Ana", "Beto", "Caro"], { rng: createRng(99), startingPlayerIndex: 0 }),
    );
    expect(s1.winnerId).toBe(s2.winnerId);
    expect(s1.players.map((p) => p.bees)).toEqual(s2.players.map((p) => p.bees));
  });

  it("funciona con 2 y con 6 jugadores", () => {
    const twoPlayers = runFullGame(
      createInitialGameState(["Ana", "Beto"], { rng: createRng(5), startingPlayerIndex: 0 }),
    );
    expect(twoPlayers.phase).toBe("terminado");
    expect(countAllCards(twoPlayers)).toBe(150);

    const sixPlayers = runFullGame(
      createInitialGameState(["A", "B", "C", "D", "E", "F"], { rng: createRng(5), startingPlayerIndex: 0 }),
    );
    expect(sixPlayers.phase).toBe("terminado");
    expect(countAllCards(sixPlayers)).toBe(150);
  });

  it("el ganador tiene las abejas máximas, y en empate gana quien tenga más cartas en mano", () => {
    const state = createInitialGameState(["Ana", "Beto", "Caro"], {
      rng: createRng(17),
      startingPlayerIndex: 0,
    });
    const finished = runFullGame(state);
    const maxBees = Math.max(...finished.players.map((p) => p.bees));
    const winner = finished.players.find((p) => p.id === finished.winnerId)!;
    expect(winner.bees).toBe(maxBees);

    const tiedPlayers = finished.players.filter((p) => p.bees === maxBees);
    if (tiedPlayers.length > 1) {
      const maxHand = Math.max(...tiedPlayers.map((p) => p.hand.length));
      expect(winner.hand.length).toBe(maxHand);
    }
  });
});
