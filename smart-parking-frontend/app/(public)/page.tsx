"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ParkingMap } from "@/components/map/ParkingMap";
import { useZones } from "@/hooks/useZones";
import { useSpots } from "@/hooks/useSpots";
import { useParkingSocket } from "@/hooks/useParkingSocket";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCards, StatsCardsSkeleton } from "@/components/dashboard/StatsCards";
import { MapFilters } from "@/components/dashboard/MapFilters";
import { ConnectionBanner } from "@/components/realtime/ConnectionBanner";
import { RelativeTime } from "@/components/realtime/RelativeTime";
import { STATUS_LABELS } from "@/lib/status-colors";
import type { Spot, SpotStatus } from "@/lib/types";

const ALL_STATUSES = new Set<SpotStatus>([
  "free",
  "occupied",
  "reserved",
  "disabled",
]);

export default function PublicMapPage() {
  const zonesQuery = useZones();
  const spotsQuery = useSpots();
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Set<SpotStatus>>(ALL_STATUSES);

  const zoneIds = useMemo(
    () => (zonesQuery.data ?? []).map((zone) => zone.id),
    [zonesQuery.data],
  );

  function handleSpotUpdate(spot: Spot) {
    toast(`Spoti ${spot.code} tani është ${STATUS_LABELS[spot.status]}`);
  }

  useParkingSocket(zoneIds, handleSpotUpdate);

  function toggleStatus(status: SpotStatus) {
    setStatuses((current) => {
      const next = new Set(current);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }

  const zones = zonesQuery.data ?? [];
  const spots = spotsQuery.data ?? [];

  const filteredZones = zoneId ? zones.filter((z) => z.id === zoneId) : zones;
  const filteredSpots = spots.filter(
    (spot) =>
      (!zoneId || spot.zoneId === zoneId) && statuses.has(spot.status),
  );

  const isLoading = zonesQuery.isLoading || spotsQuery.isLoading;
  const isError = zonesQuery.isError || spotsQuery.isError;
  const lastUpdateAt = spotsQuery.dataUpdatedAt
    ? new Date(spotsQuery.dataUpdatedAt)
    : null;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Smart Parking Prizren</h1>
          <p className="text-muted-foreground">
            Zonat dhe vendparkimet e Prizrenit — statuset përditësohen në kohë
            reale.
          </p>
        </div>
        {lastUpdateAt && (
          <p className="text-xs text-muted-foreground sm:pt-1">
            Përditësuar: <RelativeTime date={lastUpdateAt} />
          </p>
        )}
      </div>

      <ConnectionBanner lastUpdateAt={lastUpdateAt} />

      {isLoading ? (
        <StatsCardsSkeleton />
      ) : (
        <StatsCards zones={zones} spots={spots} />
      )}

      {!isLoading && !isError && (
        <MapFilters
          zones={zones}
          zoneId={zoneId}
          onZoneChange={setZoneId}
          statuses={statuses}
          onToggleStatus={toggleStatus}
        />
      )}

      {isLoading ? (
        <Skeleton className="w-full" style={{ height: "70vh" }} />
      ) : isError ? (
        <p className="text-destructive">
          S&apos;u arrit të ngarkohej harta. Provo përsëri.
        </p>
      ) : (
        <ParkingMap
          zones={filteredZones}
          spots={filteredSpots}
          height="70vh"
          fitKey={zoneId ?? "all"}
        />
      )}
    </main>
  );
}
