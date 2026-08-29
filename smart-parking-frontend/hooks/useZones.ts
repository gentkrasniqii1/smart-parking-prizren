import { useQuery } from "@tanstack/react-query";
import { getZone, getZones } from "@/lib/zones";

export function useZones() {
  return useQuery({ queryKey: ["zones"], queryFn: getZones });
}

export function useZone(id: string) {
  return useQuery({ queryKey: ["zones", id], queryFn: () => getZone(id) });
}
