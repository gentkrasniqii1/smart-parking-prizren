"use client";

import Link from "next/link";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useAdminAlerts } from "@/hooks/useAdminAlerts";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveIndicator } from "@/components/realtime/LiveIndicator";
import { cn } from "@/lib/utils";
import type { SpotStatus } from "@/lib/types";

const STATUS_LABELS: Record<SpotStatus, string> = {
  free: "Të lira",
  occupied: "Të zëna",
  reserved: "Të rezervuara",
  disabled: "Jashtë funksionit",
};

export default function AdminOverviewPage() {
  const statsQuery = useAdminStats(true);
  const alertsQuery = useAdminAlerts(true);
  const data = statsQuery.data;
  const alertCount = alertsQuery.data?.length ?? 0;
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[58px] rounded-md" />
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-8">
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
            <StatCard
              label="Alarme aktive"
              value={alertsQuery.isLoading ? "…" : alertCount}
              href="/admin/alerts"
              alert={alertCount > 0}
            />
          </div>
        ) : (
          <p className="text-destructive">S&apos;u ngarkuan dot statistikat.</p>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  alert,
}: {
  label: string;
  value: number | string;
  href?: string;
  alert?: boolean;
}) {
  const content = (
    <>
      <p
        className={cn(
          "text-2xl font-semibold tabular-nums",
          alert && "text-status-occupied-fg",
        )}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-md border p-3 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
      >
        {content}
      </Link>
    );
  }

  return <div className="rounded-md border p-3">{content}</div>;
}
