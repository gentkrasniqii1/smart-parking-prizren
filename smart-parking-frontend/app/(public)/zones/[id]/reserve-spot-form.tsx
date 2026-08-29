"use client";

import { useState, type FormEvent } from "react";
import {
  useCreateReservation,
  useSpotUpcomingReservations,
} from "@/hooks/useReservations";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ReserveSpotForm({
  spotId,
  onDone,
}: {
  spotId: string;
  onDone: () => void;
}) {
  const [startTime, setStartTime] = useState(() =>
    toLocalInputValue(new Date(Date.now() + 5 * 60_000)),
  );
  const [endTime, setEndTime] = useState(() =>
    toLocalInputValue(new Date(Date.now() + 65 * 60_000)),
  );
  const [error, setError] = useState<string | null>(null);

  const upcomingQuery = useSpotUpcomingReservations(spotId, true);
  const createReservation = useCreateReservation();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await createReservation.mutateAsync({
        spotId,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });
      onDone();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 409
            ? "Konflikt: intervali mbivendoset me një rezervim ekzistues"
            : "Kohë e pavlefshme",
        );
      } else {
        setError("Diçka shkoi keq");
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-2 flex flex-col gap-2 rounded-md border bg-muted/30 p-2"
    >
      {upcomingQuery.data && upcomingQuery.data.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Të zëna:{" "}
          {upcomingQuery.data
            .map(
              (w) =>
                `${new Date(w.startTime).toLocaleString("sq")} → ${new Date(w.endTime).toLocaleString("sq")}`,
            )
            .join("; ")}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Nga</label>
        <input
          type="datetime-local"
          required
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="rounded border px-2 py-1 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Deri</label>
        <input
          type="datetime-local"
          required
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="rounded border px-2 py-1 text-sm"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={createReservation.isPending}>
          Konfirmo rezervimin
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDone}>
          Anulo
        </Button>
      </div>
    </form>
  );
}
