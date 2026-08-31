"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Ban, Check, MapPin } from "lucide-react";
import { useZones } from "@/hooks/useZones";
import { useSpots, useUpdateSpotStatusAsAttendant } from "@/hooks/useSpots";
import { useParkingSocket } from "@/hooks/useParkingSocket";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectionBanner } from "@/components/realtime/ConnectionBanner";
import { LiveIndicator } from "@/components/realtime/LiveIndicator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from "@/lib/status-colors";
import { cn } from "@/lib/utils";
import type { Spot } from "@/lib/types";

export default function AttendantDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const zonesQuery = useZones();
  const spotsQuery = useSpots();
  const updateStatus = useUpdateSpotStatusAsAttendant();
  const [zoneId, setZoneId] = useState<string | null>(null);

  const zoneIds = useMemo(
    () => (zonesQuery.data ?? []).map((z) => z.id),
    [zonesQuery.data],
  );
  useParkingSocket(zoneIds);

  const zones = zonesQuery.data ?? [];
  const spots = spotsQuery.data ?? [];
  const visibleSpots = zoneId
    ? spots.filter((s) => s.zoneId === zoneId)
    : spots;
  const lastUpdateAt = spotsQuery.dataUpdatedAt
    ? new Date(spotsQuery.dataUpdatedAt)
    : null;

  // `Select` i base-ui i nxjerr etiketat e vlerës së zgjedhur nga `items`
  // (jo nga fëmijët) — pa këtë, trigger-i do të shfaqte vlerën e papërpunuar
  // ("all") në vend të etiketës.
  const zoneSelectItems: Record<string, string> = { all: "Të gjitha zonat" };
  for (const zone of zones) {
    zoneSelectItems[zone.id] = zone.name;
  }

  if (!user) {
    return (
      <main className="p-8">
        <p>
          Duhet të{" "}
          <Link href="/login" className="underline">
            kyçesh
          </Link>{" "}
          si rojtar.
        </p>
      </main>
    );
  }

  if (user.role !== "attendant" && user.role !== "admin") {
    return (
      <main className="p-8">
        <p className="text-destructive">
          S&apos;ke akses te ky panel (vetëm rojtarë dhe administratorë).
        </p>
      </main>
    );
  }

  function handleStatusChange(spot: Spot, status: Spot["status"]) {
    updateStatus.mutate(
      { id: spot.id, status },
      {
        onSuccess: () =>
          toast.success(`${spot.code} u shënua si ${STATUS_LABELS[status]}`),
        onError: () => toast.error("S'u ndryshua dot statusi"),
      },
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Paneli i Rojtarit</h1>
        <LiveIndicator />
      </div>

      <ConnectionBanner lastUpdateAt={lastUpdateAt} />

      {zonesQuery.isLoading ? (
        <Skeleton className="h-11 w-full sm:w-64" />
      ) : (
        <Select
          items={zoneSelectItems}
          value={zoneId ?? "all"}
          onValueChange={(v) => setZoneId(v === "all" ? null : v)}
        >
          <SelectTrigger className="min-h-11 w-full sm:w-64">
            <SelectValue placeholder="Të gjitha zonat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Të gjitha zonat</SelectItem>
            {zones.map((zone) => (
              <SelectItem key={zone.id} value={zone.id}>
                {zone.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {spotsQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[132px] rounded-xl" />
          ))}
        </div>
      ) : visibleSpots.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-card py-12 text-center">
          <MapPin className="size-8 text-muted-foreground" />
          <p className="font-medium">Asnjë vendparkim në këtë zonë</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleSpots.map((spot) => {
            const zone = zones.find((z) => z.id === spot.zoneId);
            const isDisabled = spot.status === "disabled";
            return (
              <li
                key={spot.id}
                className="flex flex-col gap-3 rounded-xl border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold">{spot.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {zone?.name ?? "—"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_BADGE_CLASSES[spot.status],
                    )}
                  >
                    {STATUS_LABELS[spot.status]}
                  </span>
                </div>

                {/* Butona të mëdhenj (min-h-11) — përdorim me një dorë në
                    terren, jo tabelë e dendur si te paneli admin. */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="min-h-11 flex-1"
                    disabled={updateStatus.isPending || isDisabled}
                    onClick={() => handleStatusChange(spot, "disabled")}
                  >
                    <Ban className="size-4" />
                    Jashtë funksionit
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-11 flex-1"
                    disabled={updateStatus.isPending || spot.status === "free"}
                    onClick={() => handleStatusChange(spot, "free")}
                  >
                    <Check className="size-4" />
                    Liro
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
