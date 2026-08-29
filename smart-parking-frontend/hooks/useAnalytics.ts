import { useQuery } from "@tanstack/react-query";
import { getHeatmap, getPeakHours } from "@/lib/analytics";

export function useHeatmap(days: number, enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "analytics", "heatmap", days],
    queryFn: () => getHeatmap(days),
    enabled,
  });
}

export function usePeakHours(days: number, enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "analytics", "peakHours", days],
    queryFn: () => getPeakHours(days),
    enabled,
  });
}
