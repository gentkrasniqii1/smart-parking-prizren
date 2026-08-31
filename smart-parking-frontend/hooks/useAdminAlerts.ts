import { useQuery } from "@tanstack/react-query";
import { getAdminAlerts } from "@/lib/admin";

// Rillogariten nga të dhëna reale në çdo thirrje (shih AdminService.getAlerts)
// — polling këtu, jo WebSocket, për të njëjtën arsye si system-health.
export function useAdminAlerts(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "alerts"],
    queryFn: getAdminAlerts,
    enabled,
    refetchInterval: 15_000,
  });
}
