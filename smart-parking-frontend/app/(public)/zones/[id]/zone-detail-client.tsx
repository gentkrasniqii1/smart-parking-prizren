"use client";

import { useMemo, useState } from "react";
import { ParkingMap } from "@/components/map/ParkingMap";
import { useZone } from "@/hooks/useZones";
import { useSpots } from "@/hooks/useSpots";
import { useParkingSocket } from "@/hooks/useParkingSocket";
import { useActiveSession, useCheckIn, useCheckOut } from "@/hooks/useSessions";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReserveSpotForm } from "./reserve-spot-form";
import type { Spot, SpotStatus } from "@/lib/types";

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
  const isLoggedIn = useAuthStore((state) => !!state.accessToken);
  const activeSessionQuery = useActiveSession();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const [reservingSpotId, setReservingSpotId] = useState<string | null>(null);

  const zoneIds = useMemo(() => [zoneId], [zoneId]);
  useParkingSocket(zoneQuery.data ? zoneIds : ZONE_IDS_EMPTY);

  if (zoneQuery.isLoading || spotsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="w-full" style={{ height: "50vh" }} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[70px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (zoneQuery.isError || !zoneQuery.data) {
    return <p className="text-destructive">Zona nuk u gjet.</p>;
  }

  const spots = spotsQuery.data ?? [];
  const activeSpotId = activeSessionQuery.data?.spot.id ?? null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{zoneQuery.data.name}</h1>

      <ParkingMap zones={[zoneQuery.data]} spots={spots} height="50vh" />

      <div>
        <h2 className="mb-2 text-lg font-medium">
          Vendparkimet ({spots.length})
        </h2>
        {!isLoggedIn && (
          <p className="mb-2 text-sm text-muted-foreground">
            Kyçu për të bërë check-in ose rezervim.
          </p>
        )}
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {spots.map((spot) => (
            <SpotRow
              key={spot.id}
              spot={spot}
              isLoggedIn={isLoggedIn}
              isMine={activeSpotId === spot.id}
              hasOtherActiveSession={!!activeSpotId && activeSpotId !== spot.id}
              onCheckIn={() => checkIn.mutate({ spotId: spot.id })}
              onCheckOut={() => checkOut.mutate()}
              isPending={checkIn.isPending || checkOut.isPending}
              isReserving={reservingSpotId === spot.id}
              onToggleReserve={() =>
                setReservingSpotId((current) =>
                  current === spot.id ? null : spot.id,
                )
              }
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

function SpotRow({
  spot,
  isLoggedIn,
  isMine,
  hasOtherActiveSession,
  onCheckIn,
  onCheckOut,
  isPending,
  isReserving,
  onToggleReserve,
}: {
  spot: Spot;
  isLoggedIn: boolean;
  isMine: boolean;
  hasOtherActiveSession: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
  isPending: boolean;
  isReserving: boolean;
  onToggleReserve: () => void;
}) {
  return (
    <li className="flex flex-col rounded-md border px-3 py-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-medium">{spot.code}</p>
          <p className="text-muted-foreground">{STATUS_LABELS[spot.status]}</p>
        </div>

        <div className="flex gap-2">
          {isMine ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onCheckOut}
              disabled={isPending}
            >
              Dola
            </Button>
          ) : isLoggedIn && spot.status === "free" && !hasOtherActiveSession ? (
            <Button size="sm" onClick={onCheckIn} disabled={isPending}>
              Parkova këtu
            </Button>
          ) : null}

          {isLoggedIn && spot.status !== "disabled" && (
            <Button size="sm" variant="outline" onClick={onToggleReserve}>
              {isReserving ? "Mbyll" : "Rezervo"}
            </Button>
          )}
        </div>
      </div>

      {isReserving && (
        <ReserveSpotForm spotId={spot.id} onDone={onToggleReserve} />
      )}
    </li>
  );
}
