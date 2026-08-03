import { useAbejasRoom } from "./useAbejasRoom";
import ConnectScreen from "./components/ConnectScreen";
import Lobby from "./components/Lobby";
import GameBoard from "./components/GameBoard";
import ResultScreen from "./components/ResultScreen";

export default function App() {
  const {
    snapshot,
    sessionId,
    roomId,
    connecting,
    connectError,
    actionError,
    connect,
    send,
    dismissActionError,
  } = useAbejasRoom();

  return (
    <div className="app">
      {actionError && (
        <div className="toast" onClick={dismissActionError}>
          ⚠️ {actionError}
        </div>
      )}

      {!snapshot || !sessionId ? (
        <ConnectScreen connecting={connecting} connectError={connectError} onConnect={connect} />
      ) : snapshot.phase === "esperando" ? (
        <Lobby snapshot={snapshot} roomId={roomId} onStartGame={() => send("startGame")} />
      ) : snapshot.phase === "terminado" ? (
        <ResultScreen snapshot={snapshot} />
      ) : (
        <GameBoard snapshot={snapshot} sessionId={sessionId} send={send} />
      )}
    </div>
  );
}
