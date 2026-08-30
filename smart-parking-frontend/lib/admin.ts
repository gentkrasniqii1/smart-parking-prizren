import { apiFetch } from "./api";
import type { AdminStats, AdminUserListItem, Role } from "./types";

export function getAdminStats(): Promise<AdminStats> {
  return apiFetch<AdminStats>("/admin/stats");
}

export function getAdminUsers(): Promise<AdminUserListItem[]> {
  return apiFetch<AdminUserListItem[]>("/admin/users");
}

export function updateUserRole(
  id: string,
  role: Role,
): Promise<AdminUserListItem> {
  return apiFetch<AdminUserListItem>(`/admin/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}
