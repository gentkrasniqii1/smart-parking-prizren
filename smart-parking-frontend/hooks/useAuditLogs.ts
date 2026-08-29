import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/lib/audit-log";

export function useAuditLogs(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "auditLogs"],
    queryFn: getAuditLogs,
    enabled,
  });
}
