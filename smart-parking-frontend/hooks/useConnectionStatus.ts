"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";

export type ConnectionStatus = "connected" | "connecting" | "disconnected";

/**
 * Gjendja reale e lidhjes WebSocket (jo e simuluar) — bazuar në eventet
 * native të socket.io-client (`connect`/`disconnect`/`reconnect_attempt`).
 * Socket-i është singleton (lib/socket.ts) dhe lidhet nga useParkingSocket
 * (harta publike) ose useNotificationsSocket (Header, kur je i kyçur), kështu
 * që kjo gjendje pasqyron lidhjen reale pavarësisht cili hook e ka inicuar.
 */
export function useConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>(() => {
    const socket = getSocket();
    if (socket.connected) return "connected";
    return socket.active ? "connecting" : "disconnected";
  });

  useEffect(() => {
    const socket = getSocket();

    function handleConnect() {
      setStatus("connected");
    }
    function handleDisconnect() {
      setStatus("disconnected");
    }
    function handleReconnectAttempt() {
      setStatus("connecting");
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.io.on("reconnect_attempt", handleReconnectAttempt);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
    };
  }, []);

  return status;
}
