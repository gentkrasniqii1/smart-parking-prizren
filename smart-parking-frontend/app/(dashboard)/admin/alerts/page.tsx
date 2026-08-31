"use client";

import Link from "next/link";
import { AlertTriangle, Info, ShieldAlert, ShieldCheck } from "lucide-react";
import { useAdminAlerts } from "@/hooks/useAdminAlerts";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { AdminAlert, AlertLevel } from "@/lib/types";

const LEVEL_CONFIG: Record<
  AlertLevel,
  { label: string; icon: typeof AlertTriangle; className: string }
> = {
  critical: {
    label: "Kritik",
    icon: ShieldAlert,
    className: "bg-status-occupied-bg text-status-occupied-fg",
  },
  warning: {
    label: "Paralajmërim",
    icon: AlertTriangle,
    className: "bg-status-reserved-bg text-status-reserved-fg",
  },
  info: {
    label: "Info",
    icon: Info,
    className: "bg-status-reserved-bg/60 text-muted-foreground",
  },
};

function AlertRow({ alert }: { alert: AdminAlert }) {
  const config = LEVEL_CONFIG[alert.level];
  const Icon = config.icon;

  const content = (
    <div className="flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          config.className,
        )}
      >
        <Icon className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
              config.className,
            )}
          >
            {config.label}
          </span>
          <p className="truncate text-sm font-medium">{alert.title}</p>
        </div>
        <p className="text-sm text-muted-foreground">{alert.message}</p>
      </div>
    </div>
  );

  if (!alert.href) {
    return content;
  }

  return (
    <Link href={alert.href} className="block outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
      {content}
    </Link>
  );
}

export default function AlertsPage() {
  const alertsQuery = useAdminAlerts(true);
  const alerts = alertsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Qendra e Alarmeve</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alarme të nxjerra nga të dhënat aktuale — rifreskohen automatikisht
          çdo 15 sekonda.
        </p>
      </div>

      {alertsQuery.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
      ) : alertsQuery.isError ? (
        <p className="text-destructive">S&apos;u ngarkuan dot alarmet.</p>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-card py-12 text-center">
          <ShieldCheck className="size-8 text-status-free-fg" />
          <p className="font-medium">Asnjë alarm aktiv</p>
          <p className="text-sm text-muted-foreground">
            Të gjitha zonat dhe shërbimet janë brenda kufijve normalë.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {alerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}
