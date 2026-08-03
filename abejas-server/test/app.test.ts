import { after, afterEach, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { ColyseusTestServer, boot } from "@colyseus/testing";
import appConfig from "../src/app.config.js";
import type { AbejasRoom } from "../src/AbejasRoom.js";

describe("AbejasRoom", () => {
  let colyseus: ColyseusTestServer;

  before(async () => {
    colyseus = await boot(appConfig);
  });
  after(async () => {
    await colyseus.shutdown();
  });
  afterEach(async () => {
    await colyseus.cleanup();
  });

  it("los jugadores se agregan a la sala de espera al unirse", async () => {
    const room = await colyseus.createRoom<AbejasRoom>("abejas", {});
    const client1 = await colyseus.connectTo(room, { name: "Ana" });
    const client2 = await colyseus.connectTo(room, { name: "Beto" });
    await room.waitForNextPatch();

    assert.equal(room.state.players.length, 2);
    assert.equal(room.state.phase, "esperando");
    assert.equal(client1.state.players.length, 2);
    assert.equal(client1.state.players[0]!.name, "Ana");
    assert.equal(client2.state.players[1]!.name, "Beto");
  });

  it("no deja empezar la partida con un solo jugador", async () => {
    const room = await colyseus.createRoom<AbejasRoom>("abejas", {});
    const client1 = await colyseus.connectTo(room, { name: "Ana" });

    client1.send("startGame");
    const message = await client1.waitForMessage("error");
    assert.match(String(message), /al menos/i);
    assert.equal(room.state.phase, "esperando");
  });

  it("arranca la partida y reparte 5 cartas por jugador", async () => {
    const room = await colyseus.createRoom<AbejasRoom>("abejas", {});
    const client1 = await colyseus.connectTo(room, { name: "Ana" });
    await colyseus.connectTo(room, { name: "Beto" });
    await colyseus.connectTo(room, { name: "Caro" });

    client1.send("startGame");
    await room.waitForNextPatch();

    assert.equal(room.state.phase, "siembra");
    assert.equal(room.state.deckCount, 150 - 5 * 3);
    assert.ok(room.state.players.every((p) => p.handCount === 5));
  });

  it("la mano es privada: un jugador no ve las cartas de los demás", async () => {
    const room = await colyseus.createRoom<AbejasRoom>("abejas", {});
    const client1 = await colyseus.connectTo(room, { name: "Ana" });
    await colyseus.connectTo(room, { name: "Beto" });

    client1.send("startGame");
    await room.waitForNextPatch();

    // Cada cliente ve su propia mano completa...
    assert.equal(client1.state.players[0]!.hand.length, 5);

    // ...pero no la del otro jugador (StateView la oculta: el campo nunca
    // llega a decodificarse en el cliente, así que queda undefined).
    assert.equal(client1.state.players[1]!.hand?.length ?? 0, 0);
    // El conteo de cartas en mano sí es público (importa para el desempate final).
    assert.equal(client1.state.players[1]!.handCount, 5);
  });

  it("solo el jugador en turno puede sembrar; los demás reciben un error", async () => {
    const room = await colyseus.createRoom<AbejasRoom>("abejas", {});
    const client1 = await colyseus.connectTo(room, { name: "Ana" });
    const client2 = await colyseus.connectTo(room, { name: "Beto" });

    client1.send("startGame");
    await room.waitForNextPatch();

    const currentIndex = room.state.currentPlayerIndex;
    const [actingClient, otherClient] =
      currentIndex === 0 ? [client1, client2] : [client2, client1];

    // El jugador que NO tiene el turno intenta sembrar: debe fallar.
    otherClient.send("sowMandatory", { plotIndex: 0 });
    const errorMessage = await otherClient.waitForMessage("error");
    assert.match(String(errorMessage), /turno/i);

    // El jugador correcto siembra su primera carta en la parcela 0.
    actingClient.send("sowMandatory", { plotIndex: 0 });
    await room.waitForNextPatch();

    const engineCurrentPlayer = room.state.players[currentIndex]!;
    assert.equal(engineCurrentPlayer.plots[0]!.cards.length, 1);
    assert.equal(engineCurrentPlayer.handCount, 4);
    assert.equal(room.state.awaitingOptionalSow, true);
  });

  it("un jugador que se va antes de empezar se quita de la lista de espera", async () => {
    const room = await colyseus.createRoom<AbejasRoom>("abejas", {});
    const client1 = await colyseus.connectTo(room, { name: "Ana" });
    await colyseus.connectTo(room, { name: "Beto" });
    await room.waitForNextPatch();
    assert.equal(room.state.players.length, 2);

    await client1.leave();
    await room.waitForNextPatch();
    assert.equal(room.state.players.length, 1);
    assert.equal(room.state.players[0]!.name, "Beto");
  });
});
