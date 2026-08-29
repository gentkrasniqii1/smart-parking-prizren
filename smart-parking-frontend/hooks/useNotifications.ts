import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMyNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";
import { getSocket } from "@/lib/socket";
import type { Notification } from "@/lib/types";

export function useNotifications(enabled: boolean) {
  return useQuery({
    queryKey: ["notifications", "me"],
    queryFn: getMyNotifications,
    enabled,
  });
}

export function useUnreadCount(enabled: boolean) {
  return useQuery({
    queryKey: ["notifications", "unreadCount"],
    queryFn: getUnreadCount,
    enabled,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

/**
 * Lidh WebSocket-in e autentikuar dhe përditëson cache-in live kur vjen
 * `notification:new` — pa polling, njësoj si spot:update (Faza 3).
 */
export function useNotificationsSocket(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const socket = getSocket();
    socket.connect();

    function handleNew(notification: Notification) {
      queryClient.setQueryData<Notification[]>(
        ["notifications", "me"],
        (old) => (old ? [notification, ...old] : old),
      );
      queryClient.setQueryData<number>(
        ["notifications", "unreadCount"],
        (old) => (old ?? 0) + 1,
      );
    }

    socket.on("notification:new", handleNew);

    return () => {
      socket.off("notification:new", handleNew);
    };
  }, [enabled, queryClient]);
}
