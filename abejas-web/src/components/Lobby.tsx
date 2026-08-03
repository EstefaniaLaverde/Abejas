import type { AbejasStateJSON } from "../types";

interface Props {
  snapshot: AbejasStateJSON;
  roomId: string | null;
  onStartGame: () => void;
}

export default function Lobby({ snapshot, roomId, onStartGame }: Props) {
  const canStart = snapshot.players.length >= 2;

  return (
    <div className="lobby">
      <h2>Sala de espera</h2>

      {roomId && (
        <p className="room-code">
          Código para invitar amigos: <strong>{roomId}</strong>
        </p>
      )}

      <ul className="player-list">
        {snapshot.players.map((p) => (
          <li key={p.sessionId}>{p.name}</li>
        ))}
        {snapshot.players.length === 0 && <li className="muted">Nadie más conectado todavía…</li>}
      </ul>

      <button onClick={onStartGame} disabled={!canStart}>
        Empezar partida
      </button>
      {!canStart && <p className="muted">Se necesitan al menos 2 jugadores.</p>}
    </div>
  );
}
