import { useState } from "react";
import type { ConnectOptions } from "../useAbejasRoom";

const DEFAULT_SERVER_URL =
  (import.meta.env.VITE_ABEJAS_SERVER_URL as string | undefined) ?? "http://localhost:2567";

interface Props {
  connecting: boolean;
  connectError: string | null;
  onConnect: (options: ConnectOptions) => void;
}

export default function ConnectScreen({ connecting, connectError, onConnect }: Props) {
  const [name, setName] = useState("");
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [roomId, setRoomId] = useState("");

  function handleSubmit(e: React.FormEvent, joinById: boolean) {
    e.preventDefault();
    if (!name.trim()) return;
    onConnect({
      serverUrl: serverUrl.trim(),
      name: name.trim(),
      roomId: joinById ? roomId.trim() : undefined,
    });
  }

  return (
    <div className="connect-screen">
      <h1>🐝 Abejas</h1>
      <p className="subtitle">Juega con tus amigos, cada uno desde su computador.</p>

      <form className="connect-form" onSubmit={(e) => handleSubmit(e, false)}>
        <label>
          Tu nombre
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ana"
            maxLength={30}
            required
          />
        </label>

        <label>
          Servidor
          <input value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} placeholder="http://localhost:2567" />
        </label>

        <button type="submit" disabled={connecting || !name.trim()}>
          {connecting ? "Conectando…" : "Crear o unirse a una partida"}
        </button>
      </form>

      <details className="join-by-id">
        <summary>¿Un amigo ya creó la sala? Únete con el código</summary>
        <form className="connect-form" onSubmit={(e) => handleSubmit(e, true)}>
          <label>
            Código de sala
            <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="ej: FST5AUR4m" />
          </label>
          <button type="submit" disabled={connecting || !name.trim() || !roomId.trim()}>
            {connecting ? "Conectando…" : "Unirme con el código"}
          </button>
        </form>
      </details>

      {connectError && <p className="error-text">{connectError}</p>}
    </div>
  );
}
