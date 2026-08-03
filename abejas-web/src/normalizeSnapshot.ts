import type { AbejasStateJSON, CardJSON, PlayerJSON, PlotJSON } from "./types";

/**
 * `state.toJSON()` de Colyseus a veces deja los campos de tipo colección
 * (arrays) como `undefined` en vez de `[]` — por ejemplo la primera vez que
 * el cliente reconstruye el esquema, antes de recibir ninguna mutación para
 * ese campo en particular. Esta función normaliza el snapshot para que
 * todos los componentes puedan asumir que los arreglos siempre existen
 * (excepto `hand`, que es intencionalmente `undefined` para la mano de los
 * demás jugadores, oculta vía StateView).
 */
export function normalizeSnapshot(raw: Partial<AbejasStateJSON> | null | undefined): AbejasStateJSON {
  const source = raw ?? {};
  return {
    players: (source.players ?? []).map(normalizePlayer),
    currentPlayerIndex: source.currentPlayerIndex ?? 0,
    phase: source.phase ?? "esperando",
    deckCount: source.deckCount ?? 0,
    deckRound: source.deckRound ?? "principal",
    compost: source.compost ?? [],
    awaitingOptionalSow: source.awaitingOptionalSow ?? false,
    pendingTradeDraw: source.pendingTradeDraw ?? [],
    tradeDrawnThisTurn: source.tradeDrawnThisTurn ?? false,
    tradeOffers: (source.tradeOffers ?? []).map((o) => ({
      ...o,
      offeredCards: o.offeredCards ?? [],
      requestedCards: o.requestedCards ?? [],
      toPlayerId: o.toPlayerId ?? "",
    })),
    pendingMandatoryPlants: source.pendingMandatoryPlants ?? [],
    finalTradeRoundDone: source.finalTradeRoundDone ?? false,
    winnerId: source.winnerId ?? "",
    log: source.log ?? [],
  };
}

function normalizePlayer(raw: Partial<PlayerJSON>): PlayerJSON {
  return {
    sessionId: raw.sessionId ?? "",
    playerId: raw.playerId ?? "",
    name: raw.name ?? "",
    connected: raw.connected ?? true,
    bees: raw.bees ?? 0,
    plots: (raw.plots ?? []).map(normalizePlot),
    // `hand` se deja tal cual: undefined es un valor válido (mano ajena, oculta).
    hand: raw.hand,
    handCount: raw.handCount ?? 0,
  };
}

function normalizePlot(raw: Partial<PlotJSON>): PlotJSON {
  return { cards: (raw.cards ?? []) as CardJSON[] };
}
