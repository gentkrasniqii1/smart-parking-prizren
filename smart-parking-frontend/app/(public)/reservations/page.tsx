"use client";

import Link from "next/link";
import {
  useMyReservations,
  useCancelReservation,
} from "@/hooks/useReservations";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Reservation } from "@/lib/types";

function formatRange(res: Reservation): string {
  const start = new Date(res.startTime).toLocaleString("sq");
  const end = new Date(res.endTime).toLocaleString("sq");
  return `${start} → ${end}`;
}

export default function ReservationsPage() {
  const isLoggedIn = useAuthStore((state) => !!state.accessToken);
  const reservationsQuery = useMyReservations();
  const cancelReservation = useCancelReservation();

  if (!isLoggedIn) {
    return (
      <main className="p-4 md:p-8">
        <p>
          Duhet të{" "}
          <Link href="/login" className="underline">
            kyçesh
          </Link>{" "}
          për t&apos;i parë rezervimet e tua.
        </p>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-4 p-4 md:p-8">
      <h1 className="text-2xl font-semibold">Rezervimet e mia</h1>

      {reservationsQuery.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !reservationsQuery.data || reservationsQuery.data.length === 0 ? (
        <p className="text-muted-foreground">S&apos;ke asnjë rezervim ende.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {reservationsQuery.data.map((res) => (
            <li
              key={res.id}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{formatRange(res)}</p>
                <p className="text-muted-foreground">
                  {res.status === "confirmed" ? "Konfirmuar" : "Anuluar"}
                </p>
              </div>
              {res.status === "confirmed" &&
                new Date(res.endTime) > new Date() && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelReservation.mutate(res.id)}
                    disabled={cancelReservation.isPending}
                  >
                    Anulo
                  </Button>
                )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
