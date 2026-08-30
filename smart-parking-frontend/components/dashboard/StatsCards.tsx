import { CircleCheck, CircleSlash2, MapPinned, SquareParking } from "lucide-react";
import type { Spot, Zone } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  zones: Zone[];
  spots: Spot[];
}

export function StatsCards({ zones, spots }: StatsCardsProps) {
  const free = spots.filter((s) => s.status === "free").length;
  const occupied = spots.filter((s) => s.status === "occupied").length;

  const cards = [
    {
      label: "Total spote",
      value: spots.length,
      icon: SquareParking,
      accent: "text-primary bg-primary/10",
    },
    {
      label: "Të lira tani",
      value: free,
      icon: CircleCheck,
      accent: "bg-status-free-bg text-status-free-fg",
    },
    {
      label: "Të zëna",
      value: occupied,
      icon: CircleSlash2,
      accent: "bg-status-occupied-bg text-status-occupied-fg",
    },
    {
      label: "Zona aktive",
      value: zones.length,
      icon: MapPinned,
      accent: "text-primary bg-primary/10",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm"
        >
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              card.accent,
            )}
          >
            <card.icon className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl leading-none font-semibold">
              {card.value}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {card.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[68px] w-full" />
      ))}
    </div>
  );
}
