"use client";

import {
  Activity,
  Database,
  Radio,
  Server,
  Wifi,
} from "lucide-react";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ServiceHealth } from "@/lib/types";

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-2 rounded-full",
        ok ? "bg-status-free-fg" : "bg-status-occupied-fg",
      )}
    />
  );
}

function HealthCard({
  icon: Icon,
  title,
  ok,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Icon className="size-4" />
          {title}
        </div>
        <StatusDot ok={ok} />
      </div>
      <p
        className={cn(
          "text-sm font-semibold",
          ok ? "text-status-free-fg" : "text-status-occupied-fg",
        )}
      >
        {ok ? "Në rregull" : "Problem"}
      </p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function latencyDetail(health: ServiceHealth): string {
  if (health.status !== "ok") {
    return "S'u arrit lidhja";
  }
  return `Latenca: ${health.latencyMs}ms`;
}

export default function SystemHealthPage() {
  const healthQuery = useSystemHealth(true);
  const data = healthQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Gjendja e sistemit</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Statuset reale të shërbimeve — rifreskohet automatikisht çdo 10
          sekonda.
        </p>
      </div>

      {healthQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[104px] rounded-xl" />
          ))}
        </div>
      ) : healthQuery.isError || !data ? (
        <p className="text-destructive">
          S&apos;u arrit të ngarkohej gjendja e sistemit.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <HealthCard
            icon={Server}
            title="API"
            ok={data.api.status === "ok"}
            detail={`Kontrolluar ${new Date(data.api.timestamp).toLocaleTimeString("sq-AL")}`}
          />
          <HealthCard
            icon={Database}
            title="Bazë e të dhënave"
            ok={data.database.status === "ok"}
            detail={latencyDetail(data.database)}
          />
          <HealthCard
            icon={Radio}
            title="Redis"
            ok={data.redis.status === "ok"}
            detail={latencyDetail(data.redis)}
          />
          <HealthCard
            icon={Wifi}
            title="WebSocket"
            ok={data.websocket.status === "ok"}
            detail={`${data.websocket.connectedClients} klientë të lidhur`}
          />
          <HealthCard
            icon={Activity}
            title="Sensor Simulator"
            ok
            detail={
              data.sensorSimulator.enabled
                ? "DEMO/SIMULATOR — aktiv"
                : "Çaktivizuar"
            }
          />
        </div>
      )}
    </div>
  );
}
