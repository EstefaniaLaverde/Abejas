import { useCallback, useEffect, useRef, useState } from "react";
import { Client, Room } from "@colyseus/sdk";
import type { AbejasStateJSON } from "./types";

export interface ConnectOptions {
  serverUrl: string;
  name: string;
  /** Si se da, se une a esa sala por id en vez de crear/unirse a cualquiera. */
  roomId?: string;
}

export function useAbejasRoom() {
  const roomRef = useRef<Room | null>(null);
  const [snapshot, setSnapshot] = useState<AbejasStateJSON | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const connect = useCallback(async ({ serverUrl, name, roomId: joinRoomId }: ConnectOptions) => {
    setConnecting(true);
    setConnectError(null);
    try {
      const client = new Client(serverUrl);
      const room = joinRoomId
        ? await client.joinById(joinRoomId, { name })
        : await client.joinOrCreate("abejas", { name });

      roomRef.current = room;
      setSessionId(room.sessionId);
      setRoomId(room.roomId);
      setSnapshot((room.state as { toJSON(): AbejasStateJSON }).toJSON());

      room.onStateChange((state: { toJSON(): AbejasStateJSON }) => {
        setSnapshot(state.toJSON());
      });

      room.onMessage("error", (message: string) => {
        setActionError(message);
      });

      room.onLeave(() => {
        roomRef.current = null;
        setSnapshot(null);
        setSessionId(null);
        setRoomId(null);
      });
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "No se pudo conectar al servidor.");
      throw err;
    } finally {
      setConnecting(false);
    }
  }, []);

  const send = useCallback((type: string, payload?: unknown) => {
    roomRef.current?.send(type, payload);
  }, []);

  const leave = useCallback(() => {
    roomRef.current?.leave();
  }, []);

  const dismissActionError = useCallback(() => setActionError(null), []);

  useEffect(() => {
    return () => {
      roomRef.current?.leave();
    };
  }, []);

  return {
    snapshot,
    sessionId,
    roomId,
    connecting,
    connectError,
    actionError,
    connect,
    send,
    leave,
    dismissActionError,
  };
}
