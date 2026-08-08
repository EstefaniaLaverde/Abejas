import type { AbejasStateJSON, GamePhase } from "../types";
import PlayerBoard from "./PlayerBoard";
import HandView from "./HandView";
import SowPanel from "./SowPanel";
import TradePanel from "./TradePanel";
import PendingPlantsPanel from "./PendingPlantsPanel";
import ActivityLog from "./ActivityLog";
import CardBadge from "./CardBadge";
import CardPile from "./CardPile";

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

/**
 * Distribución de asientos alrededor de la mesa (mazo/compost al centro),
 * como en la mesa física. El primer asiento de cada lista es siempre el
 * "propio" (abajo, más cerca de quien juega); el resto se reparte alrededor
 * en el mismo orden de turno, en sentido horario. Solo hay plantillas de 2 a
 * 6 asientos porque esos son los límites de jugadores del juego.
 */
const SEATS_BY_COUNT: Record<number, string[]> = {
  2: ["bottom", "top"],
  3: ["bottom", "tl", "tr"],
  4: ["bottom", "left", "top", "right"],
  5: ["bottom", "left", "tl", "tr", "right"],
  6: ["bottom", "bl", "left", "top", "right", "br"],
};

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

  // Rota la lista de jugadores para que "yo" quede primero (asiento de
  // abajo); el resto sigue en el mismo orden de turno (que es el orden en
  // que se sientan alrededor de la mesa).
  const seatedPlayers = [...snapshot.players.slice(myIndex), ...snapshot.players.slice(0, myIndex)];
  const seatAreas = SEATS_BY_COUNT[seatedPlayers.length] ?? SEATS_BY_COUNT[6]!;

  return (
    <div className="game-board">
      <div className="table-ring">
        <div className="table-center">
          <div className="table-piles">
            <CardPile
              count={snapshot.deckCount}
              label={snapshot.deckRound === "principal" ? "mazo (ronda principal)" : "mazo (2ª ronda, compost)"}
              variant="deck"
            />
            <CardPile
              count={snapshot.compostCount}
              label="compost"
              variant="compost"
              topCardTypeId={snapshot.compostTopTypeId || undefined}
            />
          </div>
          <span className="turn-indicator">
            {isFinalRound ? (
              "Ronda final de trueques"
            ) : (
              <>
                Turno de <strong>{currentPlayer?.name}</strong> — {phaseLabel(snapshot.phase)}
              </>
            )}
          </span>
        </div>

        {seatedPlayers.map((p, i) => {
          const originalIndex = snapshot.players.findIndex((pl) => pl.sessionId === p.sessionId);
          const area = seatAreas[i] ?? "bottom";
          return (
            <div key={p.sessionId} className={`table-seat seat-${area}`}>
              <PlayerBoard
                player={p}
                isCurrentTurn={originalIndex === snapshot.currentPlayerIndex && !isFinalRound}
                isSelf={p.sessionId === sessionId}
                onHarvest={(plotIndex) => send("harvest", { plotIndex })}
              />
            </div>
          );
        })}
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
            {isMyTurn && !snapshot.tradeDrawnThisTurn && (
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
            Tomar 3 cartas
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
