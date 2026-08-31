"use client";

import Link from "next/link";
import { CircleParking, MapPin, Radio, SquareUser, Timer } from "lucide-react";
import { useActiveSession, useCheckOut } from "@/hooks/useSessions";
import { useZones } from "@/hooks/useZones";
import { useAuthStore } from "@/store/useAuthStore";
import { useElapsedSeconds, formatDuration } from "@/hooks/useElapsedSeconds";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SessionSource } from "@/lib/types";

const SOURCE_LABELS: Record<SessionSource, string> = {
  manual: "Check-in manual",
  sensor: "Sensor",
  qr: "Skanim QR",
};

const SOURCE_ICONS: Record<SessionSource, typeof Radio> = {
  manual: SquareUser,
  sensor: Radio,
  qr: SquareUser,
};

function ActiveSessionCard() {
  const activeQuery = useActiveSession();
  const zonesQuery = useZones();
  const checkOut = useCheckOut();

  if (activeQuery.isLoading || zonesQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-md" />
      </div>
    );
  }

  const active = activeQuery.data;

  if (!active) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card py-16 text-center">
        <CircleParking className="size-10 text-muted-foreground" />
        <div>
          <p className="font-medium">S&apos;ke asnjë sesion parkimi aktiv</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Kur bën check-in te një vendparkim, sesioni yt aktiv shfaqet këtu.
          </p>
        </div>
        <Link href="/" className="mt-2">
          <Button size="sm">Gjej vendparkim</Button>
        </Link>
      </div>
    );
  }

  const zone = zonesQuery.data?.find((z) => z.id === active.spot.zoneId);
  const startedAt = new Date(active.session.checkIn);
  const SourceIcon = SOURCE_ICONS[active.session.source];

  return <SessionDetails active={active} zoneName={zone?.name} startedAt={startedAt} SourceIcon={SourceIcon} checkOut={checkOut} />;
}

function SessionDetails({
  active,
  zoneName,
  startedAt,
  SourceIcon,
  checkOut,
}: {
  active: NonNullable<ReturnType<typeof useActiveSession>["data"]>;
  zoneName: string | undefined;
  startedAt: Date;
  SourceIcon: typeof Radio;
  checkOut: ReturnType<typeof useCheckOut>;
}) {
  const elapsedSeconds = useElapsedSeconds(startedAt);

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center gap-2 border-b bg-status-free-bg px-5 py-3 text-status-free-fg">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-free-fg opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-status-free-fg" />
          </span>
          <span className="text-sm font-semibold tracking-wide uppercase">
            Parkim aktiv
          </span>
        </div>

        <div className="flex flex-col items-center gap-1 px-5 py-8 text-center">
          <p className="font-mono text-5xl font-bold tabular-nums tracking-tight">
            {formatDuration(elapsedSeconds)}
          </p>
          <p className="text-sm text-muted-foreground">kohë e kaluar</p>
        </div>

        <dl className="grid grid-cols-1 gap-4 border-t px-5 py-4 sm:grid-cols-3">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <dt className="text-xs text-muted-foreground">Vendndodhja</dt>
              <dd className="text-sm font-medium">
                {zoneName ?? "Zonë"} — {active.spot.code}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Timer className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <dt className="text-xs text-muted-foreground">Filloi</dt>
              <dd className="text-sm font-medium">
                {startedAt.toLocaleTimeString("sq-AL", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <SourceIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <dt className="text-xs text-muted-foreground">Burimi</dt>
              <dd className="text-sm font-medium">
                {SOURCE_LABELS[active.session.source]}
              </dd>
            </div>
          </div>
        </dl>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          variant="outline"
          disabled={checkOut.isPending}
          onClick={() => checkOut.mutate()}
          className="flex-1"
        >
          Dola nga vendparkimi
        </Button>
        <Link href={`/zones/${active.spot.zoneId}`} className="flex-1">
          <Button size="lg" variant="ghost" className="w-full">
            Shiko në hartë
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function SessionPage() {
  const isLoggedIn = useAuthStore((state) => !!state.accessToken);

  if (!isLoggedIn) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 p-4 md:p-8">
        <p className="text-sm text-muted-foreground">
          Duhet të{" "}
          <Link href="/login" className="text-primary underline underline-offset-4">
            kyçesh
          </Link>{" "}
          për të parë sesionin tënd.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 p-4 md:p-8">
      <h1 className="text-2xl font-semibold">Sesioni im</h1>
      <ActiveSessionCard />
    </main>
  );
}
