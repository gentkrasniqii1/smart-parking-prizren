import type { SpotStatus, Zone } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/status-colors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ALL_STATUSES: SpotStatus[] = ["free", "occupied", "reserved", "disabled"];

const STATUS_CHIP_ACTIVE: Record<SpotStatus, string> = {
  free: "border-status-free-fg bg-status-free-bg text-status-free-fg",
  occupied: "border-status-occupied-fg bg-status-occupied-bg text-status-occupied-fg",
  reserved: "border-status-reserved-fg bg-status-reserved-bg text-status-reserved-fg",
  disabled: "border-status-disabled-fg bg-status-disabled-bg text-status-disabled-fg",
};

interface MapFiltersProps {
  zones: Zone[];
  zoneId: string | null;
  onZoneChange: (zoneId: string | null) => void;
  statuses: Set<SpotStatus>;
  onToggleStatus: (status: SpotStatus) => void;
}

export function MapFilters({
  zones,
  zoneId,
  onZoneChange,
  statuses,
  onToggleStatus,
}: MapFiltersProps) {
  const items: Record<string, string> = { all: "Të gjitha zonat" };
  for (const zone of zones) {
    items[zone.id] = zone.name;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Select
        items={items}
        value={zoneId ?? "all"}
        onValueChange={(value) => onZoneChange(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-full sm:w-56">
          <SelectValue placeholder="Të gjitha zonat" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Të gjitha zonat</SelectItem>
          {zones.map((zone) => (
            <SelectItem key={zone.id} value={zone.id}>
              {zone.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-wrap gap-1.5">
        {ALL_STATUSES.map((status) => {
          const active = statuses.has(status);
          return (
            <button
              key={status}
              type="button"
              onClick={() => onToggleStatus(status)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                active
                  ? STATUS_CHIP_ACTIVE[status]
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {STATUS_LABELS[status]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
