"use client";

import { useAdminStats } from "@/hooks/useAdminStats";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveIndicator } from "@/components/realtime/LiveIndicator";
import type { SpotStatus } from "@/lib/types";

const STATUS_LABELS: Record<SpotStatus, string> = {
  free: "Të lira",
  occupied: "Të zëna",
  reserved: "Të rezervuara",
  disabled: "Jashtë funksionit",
};

export default function AdminOverviewPage() {
  const statsQuery = useAdminStats(true);
  const data = statsQuery.data;
  const occupancyRate =
    data && data.totalSpots > 0
      ? Math.round((data.spotsByStatus.occupied / data.totalSpots) * 1000) / 10
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="hidden items-center justify-between md:flex">
        <h1 className="text-2xl font-semibold">Paneli i Administratorit</h1>
        <LiveIndicator />
      </div>
      <h1 className="text-2xl font-semibold md:hidden">Përmbledhje</h1>

      <section className="flex flex-col gap-3">
        {statsQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-[58px] rounded-md" />
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-7">
            <StatCard label="Zona" value={data.totalZones} />
            <StatCard label="Spote" value={data.totalSpots} />
            <StatCard
              label="Shkalla e zënies"
              value={occupancyRate !== null ? `${occupancyRate}%` : "—"}
            />
            <StatCard label="Check-in aktive" value={data.activeSessions} />
            <StatCard label="Rezervime aktive" value={data.activeReservations} />
            {(Object.keys(STATUS_LABELS) as SpotStatus[]).map((status) => (
              <StatCard
                key={status}
                label={STATUS_LABELS[status]}
                value={data.spotsByStatus[status]}
              />
            ))}
          </div>
        ) : (
          <p className="text-destructive">S&apos;u ngarkuan dot statistikat.</p>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
