"use client";

import { useState } from "react";
import { useHeatmap, usePeakHours } from "@/hooks/useAnalytics";
import { HeatmapMap } from "@/components/map/HeatmapMap";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const DAY_OPTIONS = [7, 14, 30];
const CHART_HEIGHT_PX = 280;

export function AnalyticsPanel() {
  const [days, setDays] = useState(7);
  const heatmapQuery = useHeatmap(days, true);
  const peakHoursQuery = usePeakHours(days, true);

  const maxCount = Math.max(
    1,
    ...(peakHoursQuery.data?.map((bucket) => bucket.count) ?? [0]),
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Analitika</h2>
        <div className="flex gap-1">
          {DAY_OPTIONS.map((option) => (
            <Button
              key={option}
              size="sm"
              variant={days === option ? "default" : "outline"}
              onClick={() => setDays(option)}
            >
              {option} ditë
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Heatmap i aktivitetit (sipas vendndodhjes)
          </h3>
          {heatmapQuery.isLoading ? (
            <Skeleton className="h-[360px] w-full" />
          ) : heatmapQuery.data ? (
            <HeatmapMap data={heatmapQuery.data} />
          ) : (
            <p className="text-destructive">S&apos;u ngarkua dot heatmap-i.</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Orët e pikut (sipas orës së ditës)
          </h3>
          {peakHoursQuery.isLoading ? (
            <Skeleton className="h-[360px] w-full" />
          ) : peakHoursQuery.data ? (
            <div className="flex h-[360px] items-end gap-[2px] rounded-lg border p-3">
              {peakHoursQuery.data.map((bucket) => (
                <div
                  key={bucket.hour}
                  className="flex flex-1 flex-col items-center justify-end gap-1"
                  title={`Ora ${bucket.hour}:00 — ${bucket.count} aktivitete`}
                >
                  <div
                    className="w-full rounded-t bg-blue-500"
                    style={{
                      height: `${(bucket.count / maxCount) * CHART_HEIGHT_PX}px`,
                      minHeight: bucket.count > 0 ? "2px" : "0px",
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {bucket.hour}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-destructive">
              S&apos;u ngarkuan dot orët e pikut.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
