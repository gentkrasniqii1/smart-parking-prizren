"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import type { Notification, NotificationType } from "@/lib/types";

const TYPE_ICONS: Record<NotificationType, string> = {
  checkin: "🅿️",
  checkout: "🚗",
  reservation_confirmed: "✅",
  reservation_cancelled: "❌",
  reservation_reminder: "⏰",
};

export default function NotificationsPage() {
  const isLoggedIn = useAuthStore((state) => !!state.accessToken);
  const notificationsQuery = useNotifications(isLoggedIn);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  if (!isLoggedIn) {
    return (
      <main className="p-8">
        <p>
          Duhet të{" "}
          <Link href="/login" className="underline">
            kyçesh
          </Link>{" "}
          për t&apos;i parë njoftimet e tua.
        </p>
      </main>
    );
  }

  const notifications = notificationsQuery.data ?? [];
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <main className="flex flex-col gap-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Njoftimet</h1>
        {hasUnread && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => markAllRead.mutate()}
          >
            Shëno të gjitha si lexuar
          </Button>
        )}
      </div>

      {notificationsQuery.isLoading ? (
        <p className="text-muted-foreground">Duke ngarkuar...</p>
      ) : notifications.length === 0 ? (
        <p className="text-muted-foreground">S&apos;ke asnjë njoftim ende.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onMarkRead={() => markRead.mutate(notification.id)}
            />
          ))}
        </ul>
      )}
    </main>
  );
}

function NotificationRow({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: () => void;
}) {
  return (
    <li
      className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm ${
        notification.read ? "" : "bg-muted/40"
      }`}
    >
      <div className="flex items-start gap-2">
        <span>{TYPE_ICONS[notification.type]}</span>
        <div>
          <p>{notification.message}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(notification.createdAt).toLocaleString("sq")}
          </p>
        </div>
      </div>
      {!notification.read && (
        <Button size="sm" variant="outline" onClick={onMarkRead}>
          Shëno si lexuar
        </Button>
      )}
    </li>
  );
}
