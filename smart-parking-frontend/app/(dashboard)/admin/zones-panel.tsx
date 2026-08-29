"use client";

import { useState, type FormEvent } from "react";
import {
  useZones,
  useCreateZone,
  useUpdateZoneName,
  useDeleteZone,
} from "@/hooks/useZones";
import { useSpots } from "@/hooks/useSpots";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { Zone } from "@/lib/types";

export function ZonesPanel() {
  const zonesQuery = useZones();
  const spotsQuery = useSpots();
  const [showCreate, setShowCreate] = useState(false);

  const spotCountByZone = new Map<string, number>();
  for (const spot of spotsQuery.data ?? []) {
    spotCountByZone.set(
      spot.zoneId,
      (spotCountByZone.get(spot.zoneId) ?? 0) + 1,
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Zonat</h2>
        <Button size="sm" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Mbyll" : "Shto zonë"}
        </Button>
      </div>

      {showCreate && <CreateZoneForm onDone={() => setShowCreate(false)} />}

      <ul className="flex flex-col gap-2">
        {(zonesQuery.data ?? []).map((zone) => (
          <ZoneRow
            key={zone.id}
            zone={zone}
            spotCount={spotCountByZone.get(zone.id) ?? 0}
          />
        ))}
      </ul>
    </section>
  );
}

function ZoneRow({ zone, spotCount }: { zone: Zone; spotCount: number }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(zone.name);
  const updateName = useUpdateZoneName();
  const deleteZone = useDeleteZone();

  function handleSave() {
    updateName.mutate(
      { id: zone.id, name },
      { onSuccess: () => setEditing(false) },
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
      {editing ? (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded border px-2 py-1"
        />
      ) : (
        <span className="font-medium">
          {zone.name}{" "}
          <span className="text-muted-foreground">({spotCount} spote)</span>
        </span>
      )}

      <div className="flex gap-2">
        {editing ? (
          <>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateName.isPending}
            >
              Ruaj
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(false)}
            >
              Anulo
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
            >
              Riemërto
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (
                  confirm(
                    `Të fshihet zona "${zone.name}" bashkë me spotet e saj?`,
                  )
                ) {
                  deleteZone.mutate(zone.id);
                }
              }}
              disabled={deleteZone.isPending}
            >
              Fshij
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

function CreateZoneForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [minLng, setMinLng] = useState("20.74");
  const [minLat, setMinLat] = useState("42.21");
  const [maxLng, setMaxLng] = useState("20.742");
  const [maxLat, setMaxLat] = useState("42.212");
  const [error, setError] = useState<string | null>(null);
  const createZone = useCreateZone();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const [a, b, c, d] = [minLng, minLat, maxLng, maxLat].map(Number);
    if ([a, b, c, d].some(Number.isNaN) || a >= c || b >= d) {
      setError("Kufijtë duhet të jenë numra të vlefshëm, min < max");
      return;
    }

    try {
      await createZone.mutateAsync({
        name,
        polygon: {
          type: "Polygon",
          coordinates: [
            [
              [a, b],
              [c, b],
              [c, d],
              [a, d],
              [a, b],
            ],
          ],
        },
      });
      onDone();
    } catch (err) {
      setError(
        err instanceof ApiError ? "S'u krijua dot zona" : "Diçka shkoi keq",
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium">Emri</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border px-2 py-1 text-sm"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Kufijtë e drejtkëndëshit (zonë e thjeshtë drejtkëndore — vizatimi mbi
        hartë vjen si polish i mëvonshëm)
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <LabeledInput label="Min gjatësi" value={minLng} onChange={setMinLng} />
        <LabeledInput label="Min gjerësi" value={minLat} onChange={setMinLat} />
        <LabeledInput label="Max gjatësi" value={maxLng} onChange={setMaxLng} />
        <LabeledInput label="Max gjerësi" value={maxLat} onChange={setMaxLat} />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={createZone.isPending}>
          Krijo
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDone}>
          Anulo
        </Button>
      </div>
    </form>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium">{label}</label>
      <input
        required
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border px-2 py-1 text-sm"
      />
    </div>
  );
}
