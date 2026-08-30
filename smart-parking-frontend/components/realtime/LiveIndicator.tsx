"use client";

import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  connected: {
    label: "Live",
    tooltip: "Të dhënat e parkimit janë të lidhura në kohë reale.",
    dot: "bg-status-free-fg",
    text: "text-muted-foreground",
  },
  connecting: {
    label: "Po rilidhet…",
    tooltip: "Lidhja live u ndërpre — po provohet rilidhja.",
    dot: "bg-status-reserved-fg animate-pulse",
    text: "text-status-reserved-fg",
  },
  disconnected: {
    label: "Jashtë linje",
    tooltip: "S'ka lidhje live — të dhënat mund të mos jenë të përditësuara.",
    dot: "bg-status-occupied-fg",
    text: "text-status-occupied-fg",
  },
} as const;

export function LiveIndicator({ className }: { className?: string }) {
  const status = useConnectionStatus();
  const config = STATUS_CONFIG[status];

  return (
    <span
      title={config.tooltip}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        config.text,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 rounded-full", config.dot)}
      />
      <span className="sr-only" role="status" aria-live="polite">
        {config.tooltip}
      </span>
      <span aria-hidden="true">{config.label}</span>
    </span>
  );
}
