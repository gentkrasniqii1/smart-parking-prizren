"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useAdminStats } from "@/hooks/useAdminStats";
import { ZonesPanel } from "./zones-panel";
import { SpotsPanel } from "./spots-panel";
import { AnalyticsPanel } from "./analytics-panel";
import { AuditLogPanel } from "./audit-log-panel";
import type { SpotStatus } from "@/lib/types";

const STATUS_LABELS: Record<SpotStatus, string> = {
  free: "Të lira",
  occupied: "Të zëna",
  reserved: "Të rezervuara",
  disabled: "Jashtë funksionit",
};

export default function AdminDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";
  const statsQuery = useAdminStats(isAdmin);

  if (!user) {
    return (
      <main className="p-8">
        <p>
          Duhet të{" "}
          <Link href="/login" className="underline">
            kyçesh
          </Link>{" "}
          si administrator.
        </p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="p-8">
        <p className="text-destructive">
          S&apos;ke akses te ky panel (vetëm administratorë).
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-8 p-4 md:p-8">
      <h1 className="text-2xl font-semibold">Paneli i Administratorit</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Përmbledhje</h2>
        {statsQuery.isLoading ? (
          <p className="text-muted-foreground">Duke ngarkuar...</p>
        ) : statsQuery.data ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            <StatCard label="Zona" value={statsQuery.data.totalZones} />
            <StatCard label="Spote" value={statsQuery.data.totalSpots} />
            <StatCard
              label="Check-in aktive"
              value={statsQuery.data.activeSessions}
            />
            <StatCard
              label="Rezervime aktive"
              value={statsQuery.data.activeReservations}
            />
            {(Object.keys(STATUS_LABELS) as SpotStatus[]).map((status) => (
              <StatCard
                key={status}
                label={STATUS_LABELS[status]}
                value={statsQuery.data.spotsByStatus[status]}
              />
            ))}
          </div>
        ) : (
          <p className="text-destructive">S&apos;u ngarkuan dot statistikat.</p>
        )}
      </section>

      <ZonesPanel />
      <SpotsPanel />
      <AnalyticsPanel />
      <AuditLogPanel />
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
