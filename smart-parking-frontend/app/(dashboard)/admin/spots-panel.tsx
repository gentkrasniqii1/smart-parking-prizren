"use client";

import { useState, type FormEvent } from "react";
import { useZones } from "@/hooks/useZones";
import {
  useSpots,
  useCreateSpot,
  useUpdateSpotStatus,
  useDeleteSpot,
} from "@/hooks/useSpots";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { Spot, SpotStatus, Zone } from "@/lib/types";

const STATUS_OPTIONS: SpotStatus[] = [
  "free",
  "occupied",
  "reserved",
  "disabled",
];
const STATUS_LABELS: Record<SpotStatus, string> = {
  free: "I lirë",
  occupied: "I zënë",
  reserved: "I rezervuar",
  disabled: "Jashtë funksionit",
};

export function SpotsPanel() {
  const zonesQuery = useZones();
  const spotsQuery = useSpots();
  const [showCreate, setShowCreate] = useState(false);

  const zoneNameById = new Map(
    (zonesQuery.data ?? []).map((z) => [z.id, z.name]),
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Spotet</h2>
        <Button
          size="sm"
          onClick={() => setShowCreate((v) => !v)}
          disabled={!zonesQuery.data?.length}
        >
          {showCreate ? "Mbyll" : "Shto spot"}
        </Button>
      </div>

      {showCreate && zonesQuery.data && (
        <CreateSpotForm
          zones={zonesQuery.data}
          onDone={() => setShowCreate(false)}
        />
      )}

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        {(spotsQuery.data ?? []).map((spot) => (
          <SpotRow
            key={spot.id}
            spot={spot}
            zoneName={zoneNameById.get(spot.zoneId) ?? "?"}
          />
        ))}
      </ul>
    </section>
  );
}

function SpotRow({ spot, zoneName }: { spot: Spot; zoneName: string }) {
  const updateStatus = useUpdateSpotStatus();
  const deleteSpot = useDeleteSpot();

  return (
    <li className="flex flex-col gap-1 rounded-md border px-3 py-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">{spot.code}</span>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => {
            if (confirm(`Të fshihet spoti "${spot.code}"?`)) {
              deleteSpot.mutate(spot.id);
            }
          }}
          disabled={deleteSpot.isPending}
        >
          Fshij
        </Button>
      </div>
      <span className="text-muted-foreground">{zoneName}</span>
      <select
        value={spot.status}
        onChange={(e) =>
          updateStatus.mutate({
            id: spot.id,
            status: e.target.value as SpotStatus,
          })
        }
        disabled={updateStatus.isPending}
        className="rounded border px-2 py-1 text-sm"
      >
        {STATUS_OPTIONS.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </li>
  );
}

function CreateSpotForm({
  zones,
  onDone,
}: {
  zones: Zone[];
  onDone: () => void;
}) {
  const [code, setCode] = useState("");
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [status, setStatus] = useState<SpotStatus>("free");
  const [lng, setLng] = useState("20.74");
  const [lat, setLat] = useState("42.211");
  const [error, setError] = useState<string | null>(null);
  const createSpot = useCreateSpot();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const lngNum = Number(lng);
    const latNum = Number(lat);
    if (Number.isNaN(lngNum) || Number.isNaN(latNum)) {
      setError("Koordinatat duhet të jenë numra të vlefshëm");
      return;
    }

    try {
      await createSpot.mutateAsync({
        code,
        zoneId,
        status,
        location: { type: "Point", coordinates: [lngNum, latNum] },
      });
      onDone();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? "Ky kod ekziston tashmë në këtë zonë"
          : "Diçka shkoi keq",
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3"
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Kodi</label>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded border px-2 py-1 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Zona</label>
          <select
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="rounded border px-2 py-1 text-sm"
          >
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Gjatësia (lng)</label>
          <input
            required
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="rounded border px-2 py-1 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Gjerësia (lat)</label>
          <input
            required
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="rounded border px-2 py-1 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium">Statusi</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as SpotStatus)}
            className="rounded border px-2 py-1 text-sm"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={createSpot.isPending}>
          Krijo
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDone}>
          Anulo
        </Button>
      </div>
    </form>
  );
}
