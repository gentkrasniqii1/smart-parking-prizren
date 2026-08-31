import { useQuery } from "@tanstack/react-query";
import { getSystemHealth } from "@/lib/admin";

// Rifreskim çdo 10s — s'ka event WebSocket të dedikuar për "gjendjen e
// sistemit" (ndryshe nga statuset e spoteve/njoftimet), kështu që polling
// këtu është i pranueshëm dhe standard për një faqe "system health".
export function useSystemHealth(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "systemHealth"],
    queryFn: getSystemHealth,
    enabled,
    refetchInterval: 10_000,
  });
}
