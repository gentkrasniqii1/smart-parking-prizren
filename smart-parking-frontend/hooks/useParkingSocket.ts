"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import type { Spot } from "@/lib/types";

function patchSpotCache(
  spots: Spot[] | undefined,
  updated: Spot,
): Spot[] | undefined {
  if (!spots) {
    return spots;
  }
  return spots.map((spot) => (spot.id === updated.id ? updated : spot));
}

/**
 * Lidh WebSocket-in, bashkohet me "room"-at e zonave të dhëna, dhe përditëson
 * drejtpërdrejt cache-in e React Query kur vjen një event `spot:update` —
 * pa refetch, real-time i vërtetë.
 */
export function useParkingSocket(
  zoneIds: string[],
  onSpotUpdate?: (spot: Spot) => void,
) {
  const queryClient = useQueryClient();
  const onSpotUpdateRef = useRef(onSpotUpdate);

  useEffect(() => {
    onSpotUpdateRef.current = onSpotUpdate;
  });

  useEffect(() => {
    if (zoneIds.length === 0) {
      return;
    }

    const socket = getSocket();
    socket.connect();

    for (const zoneId of zoneIds) {
      socket.emit("zone:join", { zoneId });
    }

    function handleSpotUpdate(updated: Spot) {
      queryClient.setQueryData<Spot[]>(["spots", "all"], (old) =>
        patchSpotCache(old, updated),
      );
      queryClient.setQueryData<Spot[]>(["spots", updated.zoneId], (old) =>
        patchSpotCache(old, updated),
      );
      onSpotUpdateRef.current?.(updated);
    }

    socket.on("spot:update", handleSpotUpdate);

    return () => {
      socket.off("spot:update", handleSpotUpdate);
      for (const zoneId of zoneIds) {
        socket.emit("zone:leave", { zoneId });
      }
      // Mos e shkëput socket-in këtu: është i ndarë me
      // useNotificationsSocket (Faza 7) dhe duhet të mbetet i lidhur sa kohë
      // përdoruesi është i kyçur, jo vetëm sa kohë je në një faqe zone.
    };
  }, [zoneIds, queryClient]);
}
