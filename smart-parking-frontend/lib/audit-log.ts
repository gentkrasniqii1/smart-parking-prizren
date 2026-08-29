import { apiFetch } from "./api";
import type { AuditLogEntry } from "./types";

export function getAuditLogs(): Promise<AuditLogEntry[]> {
  return apiFetch<AuditLogEntry[]>("/audit-logs");
}
