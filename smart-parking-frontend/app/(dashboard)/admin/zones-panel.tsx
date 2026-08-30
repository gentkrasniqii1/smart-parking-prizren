"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  useZones,
  useCreateZone,
  useUpdateZoneName,
  useDeleteZone,
} from "@/hooks/useZones";
import { useSpots } from "@/hooks/useSpots";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SortableHeader } from "@/components/dashboard/SortableHeader";
import { DataTablePagination } from "@/components/dashboard/DataTablePagination";
import type { Zone } from "@/lib/types";

const PAGE_SIZE = 5;
type SortKey = "name" | "spotCount";

export function ZonesPanel() {
  const zonesQuery = useZones();
  const spotsQuery = useSpots();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [deletingZone, setDeletingZone] = useState<Zone | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const deleteZone = useDeleteZone();

  const spotCountByZone = useMemo(() => {
    const map = new Map<string, number>();
    for (const spot of spotsQuery.data ?? []) {
      map.set(spot.zoneId, (map.get(spot.zoneId) ?? 0) + 1);
    }
    return map;
  }, [spotsQuery.data]);

  const rows = useMemo(() => {
    const zones = zonesQuery.data ?? [];
    const withCount = zones.map((zone) => ({
      zone,
      spotCount: spotCountByZone.get(zone.id) ?? 0,
    }));
    const sorted = [...withCount].sort((a, b) => {
      const cmp =
        sortKey === "name"
          ? a.zone.name.localeCompare(b.zone.name)
          : a.spotCount - b.spotCount;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [zonesQuery.data, spotCountByZone, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  }

  function handleDeleteConfirm() {
    if (!deletingZone) {
      return;
    }
    deleteZone.mutate(deletingZone.id, {
      onSuccess: () => setDeletingZone(null),
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Zonat</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          Shto zonë
        </Button>
      </div>

      {zonesQuery.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ende s&apos;ka zona.</p>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader
                  sortKey="name"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={handleSort}
                >
                  Emri
                </SortableHeader>
                <SortableHeader
                  sortKey="spotCount"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={handleSort}
                >
                  Spote
                </SortableHeader>
                <TableHead className="text-right">Veprime</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map(({ zone, spotCount }) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium">{zone.name}</TableCell>
                  <TableCell>{spotCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Edito"
                        onClick={() => setEditingZone(zone)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Fshij"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingZone(zone)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <DataTablePagination
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        totalItems={rows.length}
      />

      <CreateZoneDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditZoneDialog zone={editingZone} onOpenChange={() => setEditingZone(null)} />

      <AlertDialog
        open={!!deletingZone}
        onOpenChange={(open) => !open && setDeletingZone(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fshi zonën?</AlertDialogTitle>
            <AlertDialogDescription>
              Zona &quot;{deletingZone?.name}&quot; dhe të gjitha spotet e saj
              do të fshihen përgjithmonë. Ky veprim s&apos;mund të kthehet
              mbrapsht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulo</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteZone.isPending}
            >
              Fshij
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function EditZoneDialog({
  zone,
  onOpenChange,
}: {
  zone: Zone | null;
  onOpenChange: (open: boolean) => void;
}) {
  const updateName = useUpdateZoneName();
  const [name, setName] = useState(zone?.name ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!zone) {
      return;
    }
    updateName.mutate(
      { id: zone.id, name },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={!!zone} onOpenChange={onOpenChange}>
      <DialogContent key={zone?.id}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Riemërto zonën</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-zone-name">Emri</Label>
            <Input
              id="edit-zone-name"
              required
              defaultValue={zone?.name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Anulo
            </Button>
            <Button type="submit" disabled={updateName.isPending}>
              Ruaj
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateZoneDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [minLng, setMinLng] = useState("20.74");
  const [minLat, setMinLat] = useState("42.21");
  const [maxLng, setMaxLng] = useState("20.742");
  const [maxLat, setMaxLat] = useState("42.212");
  const [error, setError] = useState<string | null>(null);
  const createZone = useCreateZone();

  function reset() {
    setName("");
    setMinLng("20.74");
    setMinLat("42.21");
    setMaxLng("20.742");
    setMaxLat("42.212");
    setError(null);
  }

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
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof ApiError ? "S'u krijua dot zona" : "Diçka shkoi keq",
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Zonë e re</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-zone-name">Emri</Label>
            <Input
              id="new-zone-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Kufijtë e drejtkëndëshit (zonë e thjeshtë drejtkëndore — vizatimi
            mbi hartë vjen si polish i mëvonshëm)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <LabeledInput label="Min gjatësi" value={minLng} onChange={setMinLng} />
            <LabeledInput label="Min gjerësi" value={minLat} onChange={setMinLat} />
            <LabeledInput label="Max gjatësi" value={maxLng} onChange={setMaxLng} />
            <LabeledInput label="Max gjerësi" value={maxLat} onChange={setMaxLat} />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Anulo
            </Button>
            <Button type="submit" disabled={createZone.isPending}>
              Krijo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-normal text-muted-foreground">
        {label}
      </Label>
      <Input
        required
        type="number"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
