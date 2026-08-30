import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface SortableHeaderProps<TKey extends string> {
  sortKey: TKey;
  activeKey: TKey;
  direction: "asc" | "desc";
  onSort: (key: TKey) => void;
  className?: string;
  children: React.ReactNode;
}

export function SortableHeader<TKey extends string>({
  sortKey,
  activeKey,
  direction,
  onSort,
  className,
  children,
}: SortableHeaderProps<TKey>) {
  const active = sortKey === activeKey;
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center gap-1 font-medium hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {children}
        <Icon className="size-3.5" />
      </button>
    </TableHead>
  );
}
