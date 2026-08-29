"use client";

import { useMemo } from "react";
import { ParkingMap } from "@/components/map/ParkingMap";
import { useZones } from "@/hooks/useZones";
import { useSpots } from "@/hooks/useSpots";
import { useParkingSocket } from "@/hooks/useParkingSocket";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicMapPage() {
  const zonesQuery = useZones();
  const spotsQuery = useSpots();

  const zoneIds = useMemo(
    () => (zonesQuery.data ?? []).map((zone) => zone.id),
    [zonesQuery.data],
  );
  useParkingSocket(zoneIds);

  return (
    <main className="flex min-h-screen flex-col gap-4 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold">Smart Parking Prizren</h1>
        <p className="text-muted-foreground">
          Zonat dhe vendparkimet e Prizrenit — statuset përditësohen në kohë
          reale.
        </p>
      </div>

      {zonesQuery.isLoading || spotsQuery.isLoading ? (
        <Skeleton className="w-full" style={{ height: "70vh" }} />
      ) : zonesQuery.isError || spotsQuery.isError ? (
        <p className="text-destructive">
          S&apos;u arrit të ngarkohej harta. Provo përsëri.
        </p>
      ) : (
        <ParkingMap
          zones={zonesQuery.data ?? []}
          spots={spotsQuery.data ?? []}
          height="70vh"
        />
      )}
    </main>
  );
}
