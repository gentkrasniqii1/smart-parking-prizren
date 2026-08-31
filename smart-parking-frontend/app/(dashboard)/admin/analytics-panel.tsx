"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useHeatmap, usePeakHours } from "@/hooks/useAnalytics";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// §43 "Lazy load heavy admin modules": maplibre-gl (~960KB) dhe recharts
// (~356KB) janë 2 chunk-et më të mëdha të gjithë aplikacionit, dhe përdoren
// VETËM këtu (+harta publike për maplibre). Me import statik ato shkarkoheshin
// sapo hapej `/admin/analytics`, edhe para se të mbërrinin të dhënat. Të dyja
// janë client-only (maplibre kërkon WebGL/window; recharts mat DOM-in),
// prandaj `ssr: false` s'humb asgjë — dhe `loading` ripërdor SAKTËSISHT të
// njëjtin Skeleton që faqja tregonte tashmë gjatë fetch-it, kështu që UX-i
// mbetet identik.
const HeatmapMap = dynamic(
  () => import("@/components/map/HeatmapMap").then((m) => m.HeatmapMap),
  { ssr: false, loading: () => <Skeleton className="h-[360px] w-full" /> },
);

const PeakHoursChart = dynamic(() => import("./peak-hours-chart"), {
  ssr: false,
  loading: () => <Skeleton className="h-[360px] w-full" />,
});

const DAY_OPTIONS = [7, 14, 30];

export function AnalyticsPanel() {
  const [days, setDays] = useState(7);
  const heatmapQuery = useHeatmap(days, true);
  const peakHoursQuery = usePeakHours(days, true);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Analitika</h1>
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
            <PeakHoursChart data={peakHoursQuery.data} />
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
