import { useQuery } from "@tanstack/react-query";
import { getAdminStats } from "@/lib/admin";

export function useAdminStats(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: getAdminStats,
    enabled,
  });
}
