"use client";

import { useAuditLogs } from "@/hooks/useAuditLogs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Koha</TableHead>
                <TableHead>Veprimi</TableHead>
                <TableHead>Aktori</TableHead>
                <TableHead>Detaje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogsQuery.data.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString("sq")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </TableCell>
                  <TableCell>{log.actorEmail ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {log.metadata ? JSON.stringify(log.metadata) : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
