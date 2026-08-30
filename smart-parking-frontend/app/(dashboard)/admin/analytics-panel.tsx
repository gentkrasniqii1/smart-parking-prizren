"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
            <div className="rounded-xl border p-3">
              <ResponsiveContainer width="100%" height={CHART_HEIGHT_PX}>
                <BarChart data={peakHoursQuery.data}>
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--color-border)"
                  />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={(hour: number) => `${hour}`}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                    interval={1}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={28}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)" }}
                    contentStyle={{
                      background: "var(--color-popover)",
                      color: "var(--color-popover-foreground)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                      fontSize: 12,
                    }}
                    labelFormatter={(hour) => `Ora ${hour}:00`}
                    formatter={(value) => [value, "Aktivitete"]}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--color-chart-1)"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
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
