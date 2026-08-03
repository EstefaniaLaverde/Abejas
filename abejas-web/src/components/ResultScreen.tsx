import type { AbejasStateJSON } from "../types";

interface Props {
  snapshot: AbejasStateJSON;
}

export default function ResultScreen({ snapshot }: Props) {
  const winner = snapshot.players.find((p) => p.playerId === snapshot.winnerId);
  const sorted = [...snapshot.players].sort((a, b) => b.bees - a.bees || b.handCount - a.handCount);

  return (
    <div className="result-screen">
      <h2>🏆 ¡Partida terminada!</h2>
      {winner && (
        <p className="winner-line">
          Gana <strong>{winner.name}</strong> con {winner.bees} abejas
        </p>
      )}

      <table className="score-table">
        <thead>
          <tr>
            <th>Jugador</th>
            <th>Abejas</th>
            <th>Cartas en mano</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.sessionId} className={p.playerId === snapshot.winnerId ? "winner-row" : ""}>
              <td>{p.name}</td>
              <td>{p.bees}</td>
              <td>{p.handCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
