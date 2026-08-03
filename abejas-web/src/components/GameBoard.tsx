import type { AbejasStateJSON, GamePhase } from "../types";
import PlayerBoard from "./PlayerBoard";
import HandView from "./HandView";
import SowPanel from "./SowPanel";
import TradePanel from "./TradePanel";
import PendingPlantsPanel from "./PendingPlantsPanel";
import ActivityLog from "./ActivityLog";
import CardBadge from "./CardBadge";

interface Props {
  snapshot: AbejasStateJSON;
  sessionId: string;
  send: (type: string, payload?: unknown) => void;
}

function phaseLabel(phase: GamePhase): string {
  switch (phase) {
    case "siembra":
      return "Siembra";
    case "trueque":
      return "Trueque";
    case "toma":
      return "Toma de cartas";
    case "ronda-final-trueque":
      return "Ronda final de trueques";
    default:
      return phase;
  }
}

export default function GameBoard({ snapshot, sessionId, send }: Props) {
  const me = snapshot.players.find((p) => p.sessionId === sessionId);
  if (!me) return <p className="muted">Cargando partida…</p>;

  const myIndex = snapshot.players.findIndex((p) => p.sessionId === sessionId);
  const isMyTurn = snapshot.currentPlayerIndex === myIndex;
  const currentPlayer = snapshot.players[snapshot.currentPlayerIndex];
  const isFinalRound = snapshot.phase === "ronda-final-trueque";

  const canFinishTrade =
    snapshot.pendingTradeDraw.length === 0 &&
    snapshot.tradeOffers.every((o) => o.status !== "pendiente") &&
    snapshot.pendingMandatoryPlants.length === 0;

  const canEndFinalRound =
    snapshot.tradeOffers.every((o) => o.status !== "pendiente") && snapshot.pendingMandatoryPlants.length === 0;

  return (
    <div className="game-board">
      <header className="game-header">
        <span>
          Mazo: {snapshot.deckCount} cartas ({snapshot.deckRound === "principal" ? "ronda principal" : "segunda ronda (compost)"})
        </span>
        <span>Compost: {snapshot.compost.length} cartas</span>
        <span className="turn-indicator">
          {isFinalRound ? "Ronda final de trueques" : (
            <>
              Turno de <strong>{currentPlayer?.name}</strong> — {phaseLabel(snapshot.phase)}
            </>
          )}
        </span>
      </header>

      <div className="players-grid">
        {snapshot.players.map((p, i) => (
          <PlayerBoard
            key={p.sessionId}
            player={p}
            isCurrentTurn={i === snapshot.currentPlayerIndex && !isFinalRound}
            isSelf={p.sessionId === sessionId}
            onHarvest={(plotIndex) => send("harvest", { plotIndex })}
          />
        ))}
      </div>

      <section className="your-area">
        <h3>Tu mano</h3>
        <HandView hand={me.hand ?? []} highlightFirst={snapshot.phase === "siembra" && isMyTurn} />

        <PendingPlantsPanel me={me} pendingPlants={snapshot.pendingMandatoryPlants} send={send} />

        {snapshot.phase === "siembra" && isMyTurn && (
          <SowPanel me={me} awaitingOptionalSow={snapshot.awaitingOptionalSow} send={send} />
        )}

        {snapshot.phase === "trueque" && (
          <>
            {isMyTurn && snapshot.pendingTradeDraw.length === 0 && (
              <button type="button" onClick={() => send("drawTradeCards")}>
                Robar 2 cartas
              </button>
            )}

            {snapshot.pendingTradeDraw.length > 0 && isMyTurn && (
              <div className="drawn-plant-targets">
                <p className="muted">Puedes plantar directo las cartas robadas:</p>
                {snapshot.pendingTradeDraw.map((card) => (
                  <div key={card.id} className="pending-plant-row">
                    <CardBadge typeId={card.typeId} />
                    {me.plots.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => send("plantDrawnCard", { cardId: card.id, plotIndex: i })}
                      >
                        Parcela {i + 1}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <TradePanel
              me={me}
              players={snapshot.players}
              tradeOffers={snapshot.tradeOffers}
              drawnCards={isMyTurn ? snapshot.pendingTradeDraw : []}
              proposeMessageType="proposeTrade"
              canPropose={isMyTurn}
              send={send}
            />

            {isMyTurn && (
              <button type="button" disabled={!canFinishTrade} onClick={() => send("finishTradePhase")}>
                Terminar trueque
              </button>
            )}
          </>
        )}

        {snapshot.phase === "toma" && isMyTurn && (
          <button type="button" onClick={() => send("drawEndOfTurnCards")}>
            Tomar 2 cartas
          </button>
        )}

        {isFinalRound && (
          <>
            <TradePanel
              me={me}
              players={snapshot.players}
              tradeOffers={snapshot.tradeOffers}
              proposeMessageType="proposeFinalRoundTrade"
              send={send}
            />
            <button type="button" disabled={!canEndFinalRound} onClick={() => send("endFinalTradeRound")}>
              Terminar ronda final y ver resultado
            </button>
          </>
        )}
      </section>

      <ActivityLog log={snapshot.log} />
    </div>
  );
}
