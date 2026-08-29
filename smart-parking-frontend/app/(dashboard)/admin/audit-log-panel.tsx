"use client";

import { useAuditLogs } from "@/hooks/useAuditLogs";
import { Skeleton } from "@/components/ui/skeleton";

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Hyrje",
  "auth.login_failed": "Hyrje e dështuar",
  "auth.register": "Regjistrim",
  "zone.create": "Krijim zone",
  "zone.update": "Ndryshim zone",
  "zone.delete": "Fshirje zone",
  "spot.create": "Krijim spoti",
  "spot.update": "Ndryshim spoti",
  "spot.delete": "Fshirje spoti",
};

export function AuditLogPanel() {
  const auditLogsQuery = useAuditLogs(true);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Audit Log</h2>

      {auditLogsQuery.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : !auditLogsQuery.data || auditLogsQuery.data.length === 0 ? (
        <p className="text-muted-foreground">
          Ende s&apos;ka veprime të regjistruara.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2">Koha</th>
                <th className="px-3 py-2">Veprimi</th>
                <th className="px-3 py-2">Aktori</th>
                <th className="px-3 py-2">Detaje</th>
              </tr>
            </thead>
            <tbody>
              {auditLogsQuery.data.map((log) => (
                <tr key={log.id} className="border-t">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString("sq")}
                  </td>
                  <td className="px-3 py-2">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </td>
                  <td className="px-3 py-2">{log.actorEmail ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {log.metadata ? JSON.stringify(log.metadata) : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
