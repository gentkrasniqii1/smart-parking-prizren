"use client";

import { useEffect, useState } from "react";

function formatRelative(date: Date, now: Date): string {
  const diffSec = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (diffSec < 5) return "tani";
  if (diffSec < 60) return `${diffSec} sek. më parë`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min. më parë`;
  const diffHour = Math.floor(diffMin / 60);
  return `${diffHour} orë më parë`;
}

/** Etiketë kohore relative ("12 sek. më parë") që rifreskohet vetë çdo 5s —
 * përdor `dataUpdatedAt` të React Query, jo një state të veçantë (shih §57). */
export function RelativeTime({ date }: { date: Date }) {
  const [, tick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => tick((n) => n + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  return <>{formatRelative(date, new Date())}</>;
}
