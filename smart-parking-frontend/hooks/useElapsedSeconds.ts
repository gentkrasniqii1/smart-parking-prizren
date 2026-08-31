import { useEffect, useState } from "react";

/** Sekondat e kaluara që nga `since`, rifreskohet çdo sekondë (për ekranin e
 * sesionit aktiv — §14: kohëmatës live, jo statik). */
export function useElapsedSeconds(since: Date): number {
  const [elapsed, setElapsed] = useState(() =>
    Math.max(0, Math.floor((Date.now() - since.getTime()) / 1000)),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - since.getTime()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [since]);

  return elapsed;
}

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
