"use client";

import { useMemo } from "react";
import { ParkingMap } from "@/components/map/ParkingMap";
import { useZone } from "@/hooks/useZones";
import { useSpots } from "@/hooks/useSpots";
import { useParkingSocket } from "@/hooks/useParkingSocket";
import type { SpotStatus } from "@/lib/types";

const STATUS_LABELS: Record<SpotStatus, string> = {
  free: "I lirë",
  occupied: "I zënë",
  reserved: "I rezervuar",
  disabled: "Jashtë funksionit",
};

const ZONE_IDS_EMPTY: string[] = [];

export function ZoneDetailClient({ zoneId }: { zoneId: string }) {
  const zoneQuery = useZone(zoneId);
  const spotsQuery = useSpots(zoneId);

  const zoneIds = useMemo(() => [zoneId], [zoneId]);
  useParkingSocket(zoneQuery.data ? zoneIds : ZONE_IDS_EMPTY);

  if (zoneQuery.isLoading || spotsQuery.isLoading) {
    return <p className="text-muted-foreground">Duke ngarkuar zonën...</p>;
  }

  if (zoneQuery.isError || !zoneQuery.data) {
    return <p className="text-destructive">Zona nuk u gjet.</p>;
  }

  const spots = spotsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{zoneQuery.data.name}</h1>

      <ParkingMap zones={[zoneQuery.data]} spots={spots} height="50vh" />

      <div>
        <h2 className="mb-2 text-lg font-medium">
          Vendparkimet ({spots.length})
        </h2>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {spots.map((spot) => (
            <li
              key={spot.id}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span className="font-medium">{spot.code}</span>
              <span className="text-muted-foreground">
                {STATUS_LABELS[spot.status]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
