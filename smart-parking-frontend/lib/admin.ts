import { apiFetch } from "./api";
import type { AdminStats } from "./types";

export function getAdminStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>("/admin/stats");
}
