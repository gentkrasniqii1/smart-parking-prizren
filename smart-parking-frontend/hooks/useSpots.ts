import { useQuery } from "@tanstack/react-query";
import { getSpots } from "@/lib/spots";

export function useSpots(zoneId?: string) {
  return useQuery({
    queryKey: ["spots", zoneId ?? "all"],
    queryFn: () => getSpots(zoneId),
  });
}
