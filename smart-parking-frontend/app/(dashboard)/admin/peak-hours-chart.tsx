"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PeakHourBucket } from "@/lib/types";

const CHART_HEIGHT_PX = 280;

// Skedar i veçantë vetëm që `recharts` të mund të ndahet në një chunk të vet
// (shih koment-in te analytics-panel.tsx) — `next/dynamic` ndan për-modul,
// jo për-import, prandaj grafiku duhet të jetë modul më vete.
export default function PeakHoursChart({ data }: { data: PeakHourBucket[] }) {
  return (
    <div className="rounded-xl border p-3">
      <ResponsiveContainer width="100%" height={CHART_HEIGHT_PX}>
        <BarChart data={data}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
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
          <Bar dataKey="count" fill="var(--color-chart-1)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
