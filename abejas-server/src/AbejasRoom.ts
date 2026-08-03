import { Room, Client } from "colyseus";
import { StateView } from "@colyseus/schema";
import {
  createInitialGameState,
  sowMandatoryCard,
  sowOptionalCard,
  skipOptionalSow,
  harvestPlot,
  drawTradeCards,
  plantDrawnCard,
  proposeTrade,
  cancelTrade,
  acceptTrade,
  plantMandatoryTradeCard,
  finishTradePhase,
  drawEndOfTurnCards,
  proposeFinalRoundTrade,
  endFinalTradeRoundAndFinishGame,
  GameError,
} from "@abejas/game";
import type { GameState, RequestedCards } from "@abejas/game";
import { AbejasState } from "./schema/AbejasState.js";
import { PlayerSchema } from "./schema/PlayerSchema.js";
import { syncStateFromEngine } from "./sync.js";

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;
const RECONNECTION_TIMEOUT_SECONDS = 5 * 60;

export class AbejasRoom extends Room {
  maxClients = MAX_PLAYERS;
  state = new AbejasState();

  /** Estado del motor de reglas; no existe hasta que la partida arranca. */
  private engineState: GameState | null = null;

  /** Orden de entrada a la sala == orden de turno de la partida. */
  private joinOrder: string[] = [];
  private playerIdBySessionId = new Map<string, string>();
  private sessionIdByPlayerId = new Map<string, string>();

  onCreate(): void {
    this.state.phase = "esperando";
  }

  onJoin(client: Client, options: { name?: string }): void {
    if (this.engineState) {
      throw new GameError("La partida ya comenzó, no se pueden unir más jugadores.");
    }

    const name = (options?.name ?? `Jugador ${this.joinOrder.length + 1}`).slice(0, 30);

    const playerSchema = new PlayerSchema();
    playerSchema.sessionId = client.sessionId;
    playerSchema.name = name;
    this.state.players.push(playerSchema);
    this.joinOrder.push(client.sessionId);

    // Cada cliente solo ve su propia mano (información privada).
    client.view = new StateView();
    client.view.add(playerSchema);

    this.log(`${name} se unió a la sala.`);
  }

  onLeave(client: Client): void {
    if (!this.engineState) {
      // Todavía en el lobby: se puede quitar de la lista sin problema.
      const index = this.joinOrder.indexOf(client.sessionId);
      if (index !== -1) {
        this.joinOrder.splice(index, 1);
        this.state.players.splice(index, 1);
      }
      return;
    }

    // Partida en curso: se marca como desconectado, no se elimina (las
    // reglas del motor no contemplan sacar jugadores a mitad de partida).
    const playerSchema = this.findPlayerSchemaBySessionId(client.sessionId);
    if (playerSchema) playerSchema.connected = false;
  }

  async onDrop(client: Client): Promise<void> {
    if (!this.engineState) return;
    const playerSchema = this.findPlayerSchemaBySessionId(client.sessionId);
    if (playerSchema) playerSchema.connected = false;
    await this.allowReconnection(client, RECONNECTION_TIMEOUT_SECONDS);
  }

  onReconnect(client: Client): void {
    client.view = new StateView();
    const playerSchema = this.findPlayerSchemaBySessionId(client.sessionId);
    if (playerSchema) {
      playerSchema.connected = true;
      client.view.add(playerSchema);
    }
  }

  messages = {
    startGame: (client: Client) => {
      this.act(client, () => this.startGame());
    },

    sowMandatory: (client: Client, payload: { plotIndex: number }) => {
      this.act(client, (playerId) => sowMandatoryCard(this.requireEngine(), playerId, payload.plotIndex));
    },

    sowOptional: (client: Client, payload: { plotIndex: number }) => {
      this.act(client, (playerId) => sowOptionalCard(this.requireEngine(), playerId, payload.plotIndex));
    },

    skipOptionalSow: (client: Client) => {
      this.act(client, (playerId) => skipOptionalSow(this.requireEngine(), playerId));
    },

    harvest: (client: Client, payload: { plotIndex: number }) => {
      this.act(client, (playerId) => harvestPlot(this.requireEngine(), playerId, payload.plotIndex));
    },

    drawTradeCards: (client: Client) => {
      this.act(client, (playerId) => drawTradeCards(this.requireEngine(), playerId));
    },

    plantDrawnCard: (client: Client, payload: { cardId: string; plotIndex: number }) => {
      this.act(client, (playerId) =>
        plantDrawnCard(this.requireEngine(), playerId, payload.cardId, payload.plotIndex),
      );
    },

    proposeTrade: (
      client: Client,
      payload: { offeredCardIds: string[]; requestedCards: RequestedCards[] },
    ) => {
      this.act(client, (playerId) =>
        proposeTrade(this.requireEngine(), playerId, payload.offeredCardIds, payload.requestedCards),
      );
    },

    cancelTrade: (client: Client, payload: { offerId: string }) => {
      this.act(client, (playerId) => cancelTrade(this.requireEngine(), payload.offerId, playerId));
    },

    acceptTrade: (client: Client, payload: { offerId: string }) => {
      this.act(client, (playerId) => acceptTrade(this.requireEngine(), payload.offerId, playerId));
    },

    plantMandatoryTradeCard: (client: Client, payload: { cardId: string; plotIndex: number }) => {
      this.act(client, (playerId) =>
        plantMandatoryTradeCard(this.requireEngine(), playerId, payload.cardId, payload.plotIndex),
      );
    },

    finishTradePhase: (client: Client) => {
      this.act(client, (playerId) => finishTradePhase(this.requireEngine(), playerId));
    },

    drawEndOfTurnCards: (client: Client) => {
      this.act(client, (playerId) => drawEndOfTurnCards(this.requireEngine(), playerId));
    },

    proposeFinalRoundTrade: (
      client: Client,
      payload: { offeredCardIds: string[]; requestedCards: RequestedCards[] },
    ) => {
      this.act(client, (playerId) =>
        proposeFinalRoundTrade(this.requireEngine(), playerId, payload.offeredCardIds, payload.requestedCards),
      );
    },

    endFinalTradeRound: (client: Client) => {
      this.act(client, () => endFinalTradeRoundAndFinishGame(this.requireEngine()));
    },
  };

  // --- Helpers internos ---

  private startGame(): void {
    if (this.engineState) throw new GameError("La partida ya comenzó.");
    if (this.joinOrder.length < MIN_PLAYERS) {
      throw new GameError(`Se necesitan al menos ${MIN_PLAYERS} jugadores para empezar.`);
    }

    const names = this.joinOrder.map((sessionId) => this.findPlayerSchemaBySessionId(sessionId)!.name);
    this.engineState = createInitialGameState(names);

    this.engineState.players.forEach((player, index) => {
      const sessionId = this.joinOrder[index]!;
      this.playerIdBySessionId.set(sessionId, player.id);
      this.sessionIdByPlayerId.set(player.id, sessionId);
    });

    this.lock();
    this.syncState();
  }

  /**
   * Ejecuta una acción del motor para el jugador dueño de `client`, atrapa
   * errores de reglas (`GameError`) y los devuelve solo a ese cliente, y
   * sincroniza el estado de red si la acción tuvo éxito.
   */
  private act(client: Client, fn: (playerId: string) => void): void {
    try {
      // Antes de que la partida arranque no hay playerId; las funciones que
      // sí lo necesitan fallarán con un GameError claro al usarlo (p.ej.
      // "jugador desconocido" o, dentro de `requireEngine()`, "la partida
      // todavía no ha comenzado").
      const playerId = this.playerIdBySessionId.get(client.sessionId) ?? "";
      fn(playerId);
      this.syncState();
    } catch (err) {
      if (err instanceof GameError) {
        client.send("error", err.message);
      } else {
        throw err;
      }
    }
  }

  private requireEngine(): GameState {
    if (!this.engineState) throw new GameError("La partida todavía no ha comenzado.");
    return this.engineState;
  }

  private syncState(): void {
    if (!this.engineState) return;
    syncStateFromEngine(this.engineState, this.state, this.sessionIdByPlayerId);
    this.refreshHandVisibility();
  }

  /**
   * `@view()` en un campo de tipo colección (como `hand`) requiere agregar
   * cada elemento individualmente al `StateView`, no solo la instancia
   * padre (`PlayerSchema`). Se vuelve a llamar tras cada sync porque
   * `syncStateFromEngine` puede crear instancias nuevas de `CardSchema`
   * cuando la mano crece.
   */
  private refreshHandVisibility(): void {
    for (const playerSchema of this.state.players) {
      if (!playerSchema.sessionId) continue;
      const client = this.clients.getById(playerSchema.sessionId);
      if (!client?.view) continue;
      client.view.add(playerSchema);
      for (const card of playerSchema.hand) {
        client.view.add(card);
      }
    }
  }

  private findPlayerSchemaBySessionId(sessionId: string): PlayerSchema | undefined {
    return this.state.players.find((p) => p.sessionId === sessionId);
  }

  private log(message: string): void {
    this.state.log.push(message);
  }
}
