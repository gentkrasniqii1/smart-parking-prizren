"use client";

import { useEffect } from "react";
import { getSocket } from "@/lib/socket";

export function useParkingSocket(zoneId: string) {
  useEffect(() => {
    const socket = getSocket();
    socket.connect();
    socket.emit("zone:join", { zoneId });

    return () => {
      socket.emit("zone:leave", { zoneId });
      socket.disconnect();
    };
  }, [zoneId]);
}
