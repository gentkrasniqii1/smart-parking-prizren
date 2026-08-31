"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { RelativeTime } from "./RelativeTime";
import { cn } from "@/lib/utils";

/**
 * Banner i dukshëm mbi hartë kur lidhja live nuk është aktive — §74: "Live
 * connection lost" → "Reconnecting..." → "Live", asnjëherë mos u shtir se
 * të dhënat janë live kur s'janë. Kthehet `null` (asgjë) kur lidhur, në vend
 * që gjithmonë të zërë vend — shih LiveIndicator për gjendjen "connected".
 */
export function ConnectionBanner({ lastUpdateAt }: { lastUpdateAt: Date | null }) {
  const status = useConnectionStatus();

  if (status === "connected") {
    return null;
  }

  const isConnecting = status === "connecting";

  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
        isConnecting
          ? "border-status-reserved-fg/30 bg-status-reserved-bg text-status-reserved-fg"
          : "border-status-occupied-fg/30 bg-status-occupied-bg text-status-occupied-fg",
      )}
    >
      {isConnecting ? (
        <RefreshCw className="size-4 shrink-0 animate-spin" />
      ) : (
        <WifiOff className="size-4 shrink-0" />
      )}
      <span>
        {isConnecting
          ? "Lidhja live u ndërpre — po rilidhet…"
          : "Jashtë linje — të dhënat mund të mos jenë të përditësuara."}
        {lastUpdateAt && (
          <>
            {" "}
            Përditësuar së fundmi: <RelativeTime date={lastUpdateAt} />.
          </>
        )}
      </span>
    </div>
  );
}
