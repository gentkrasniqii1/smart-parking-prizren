"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { useZones } from "@/hooks/useZones";
import {
  useSpots,
  useCreateSpot,
  useUpdateSpotStatus,
  useDeleteSpot,
} from "@/hooks/useSpots";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { Spot, SpotStatus, Zone } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/status-colors";

const STATUS_OPTIONS: SpotStatus[] = [
  "free",
  "occupied",
  "reserved",
  "disabled",
];
const PAGE_SIZE = 8;
type SortKey = "code" | "zone" | "status";

export function SpotsPanel() {
  const zonesQuery = useZones();
  const spotsQuery = useSpots();
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingSpot, setDeletingSpot] = useState<Spot | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("code");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const deleteSpot = useDeleteSpot();

  const zoneNameById = useMemo(
    () => new Map((zonesQuery.data ?? []).map((z) => [z.id, z.name])),
    [zonesQuery.data],
  );

  const rows = useMemo(() => {
    const spots = spotsQuery.data ?? [];
    const sorted = [...spots].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "code") {
        cmp = a.code.localeCompare(b.code);
      } else if (sortKey === "zone") {
        cmp = (zoneNameById.get(a.zoneId) ?? "").localeCompare(
          zoneNameById.get(b.zoneId) ?? "",
        );
      } else {
        cmp = a.status.localeCompare(b.status);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [spotsQuery.data, zoneNameById, sortKey, sortDir]);

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
    if (!deletingSpot) {
      return;
    }
    deleteSpot.mutate(deletingSpot.id, {
      onSuccess: () => setDeletingSpot(null),
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Vendparkimet</h1>
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          disabled={!zonesQuery.data?.length}
        >
          Shto spot
        </Button>
      </div>

      {spotsQuery.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ende s&apos;ka spote.</p>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader
                  sortKey="code"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={handleSort}
                >
                  Kodi
                </SortableHeader>
                <SortableHeader
                  sortKey="zone"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={handleSort}
                >
                  Zona
                </SortableHeader>
                <SortableHeader
                  sortKey="status"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={handleSort}
                >
                  Statusi
                </SortableHeader>
                <TableHead className="text-right">Veprime</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((spot) => (
                <SpotRow
                  key={spot.id}
                  spot={spot}
                  zoneName={zoneNameById.get(spot.zoneId) ?? "?"}
                  onDelete={() => setDeletingSpot(spot)}
                />
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

      <CreateSpotDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        zones={zonesQuery.data ?? []}
      />

      <AlertDialog
        open={!!deletingSpot}
        onOpenChange={(open) => !open && setDeletingSpot(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fshi spotin?</AlertDialogTitle>
            <AlertDialogDescription>
              Spoti &quot;{deletingSpot?.code}&quot; do të fshihet
              përgjithmonë. Ky veprim s&apos;mund të kthehet mbrapsht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulo</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteSpot.isPending}
            >
              Fshij
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function SpotRow({
  spot,
  zoneName,
  onDelete,
}: {
  spot: Spot;
  zoneName: string;
  onDelete: () => void;
}) {
  const updateStatus = useUpdateSpotStatus();

  return (
    <TableRow>
      <TableCell className="font-medium">{spot.code}</TableCell>
      <TableCell className="text-muted-foreground">{zoneName}</TableCell>
      <TableCell>
        <Select
          items={STATUS_LABELS}
          value={spot.status}
          onValueChange={(value) =>
            updateStatus.mutate({ id: spot.id, status: value as SpotStatus })
          }
        >
          <SelectTrigger size="sm" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-right">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Fshij"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function CreateSpotDialog({
  open,
  onOpenChange,
  zones,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zones: Zone[];
}) {
  const [code, setCode] = useState("");
  // "" derisa useri zgjedh diçka — parazgjedhja e zonës së parë llogaritet
  // nga `zones` në render (jo në useState), pasi ky dialog mbetet i montuar
  // edhe pa qenë i hapur (për animacion) dhe zonat mund të mbërrijnë vonë.
  const [zoneId, setZoneId] = useState("");
  const effectiveZoneId = zoneId || (zones[0]?.id ?? "");
  const [status, setStatus] = useState<SpotStatus>("free");
  const [lng, setLng] = useState("20.74");
  const [lat, setLat] = useState("42.211");
  const [error, setError] = useState<string | null>(null);
  const createSpot = useCreateSpot();

  function reset() {
    setCode("");
    setZoneId("");
    setStatus("free");
    setLng("20.74");
    setLat("42.211");
    setError(null);
  }

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
        zoneId: effectiveZoneId,
        status,
        location: { type: "Point", coordinates: [lngNum, latNum] },
      });
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? "Ky kod ekziston tashmë në këtë zonë"
          : "Diçka shkoi keq",
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
            <DialogTitle>Spot i ri</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-spot-code">Kodi</Label>
              <Input
                id="new-spot-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Zona</Label>
              <Select
                items={Object.fromEntries(zones.map((z) => [z.id, z.name]))}
                value={effectiveZoneId}
                onValueChange={(value) => setZoneId(value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-spot-lng">Gjatësia (lng)</Label>
              <Input
                id="new-spot-lng"
                required
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-spot-lat">Gjerësia (lat)</Label>
              <Input
                id="new-spot-lat"
                required
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Statusi</Label>
              <Select
                items={STATUS_LABELS}
                value={status}
                onValueChange={(v) => setStatus(v as SpotStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <Button type="submit" disabled={createSpot.isPending}>
              Krijo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
