import { apiFetch } from "./api";
import type { Notification } from "./types";

export function getMyNotifications(): Promise<Notification[]> {
  return apiFetch<Notification[]>("/notifications/me");
}

export function getUnreadCount(): Promise<number> {
  return apiFetch<number>("/notifications/me/unread-count");
}

export function markNotificationRead(id: string): Promise<Notification> {
  return apiFetch<Notification>(`/notifications/${id}/read`, {
    method: "POST",
  });
}

export function markAllNotificationsRead(): Promise<void> {
  return apiFetch<void>("/notifications/read-all", { method: "POST" });
}
