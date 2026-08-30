import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataTablePaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  totalItems: number;
}

export function DataTablePagination({
  page,
  pageCount,
  onPageChange,
  totalItems,
}: DataTablePaginationProps) {
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
      <span>
        Faqja {page + 1} nga {pageCount} ({totalItems} gjithsej)
      </span>
      <div className="flex gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          aria-label="Faqja e mëparshme"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount - 1}
          aria-label="Faqja tjetër"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
