"use client";

import { ParkingMap } from "@/components/map/ParkingMap";
import { useZones } from "@/hooks/useZones";
import { useSpots } from "@/hooks/useSpots";

export default function PublicMapPage() {
  const zonesQuery = useZones();
  const spotsQuery = useSpots();

  return (
    <main className="flex min-h-screen flex-col gap-4 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold">Smart Parking Prizren</h1>
        <p className="text-muted-foreground">
          Zonat dhe vendparkimet e Prizrenit. Statuset tregohen ende në mënyrë
          statike — përditësimi live vjen në Fazën 3.
        </p>
      </div>

      {zonesQuery.isLoading || spotsQuery.isLoading ? (
        <p className="text-muted-foreground">Duke ngarkuar hartën...</p>
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
