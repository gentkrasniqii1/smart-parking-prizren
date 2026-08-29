"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { logout as apiLogout } from "@/lib/auth";
import { getSocket } from "@/lib/socket";
import {
  useUnreadCount,
  useNotificationsSocket,
} from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";

export function Header() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const isLoggedIn = !!user;
  const [menuOpen, setMenuOpen] = useState(false);

  const unreadCountQuery = useUnreadCount(isLoggedIn);
  useNotificationsSocket(isLoggedIn);

  async function handleLogout() {
    try {
      await apiLogout();
    } catch {
      // token-i mund të jetë skaduar tashmë; s'ka rëndësi, po e pastrojmë gjithsesi
    }
    getSocket().disconnect();
    setMenuOpen(false);
    clearSession();
    router.push("/");
  }

  return (
    <header className="border-b px-4 py-3 md:px-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="font-semibold">
          Smart Parking Prizren
        </Link>

        {user ? (
          <>
            {/* Nav e plotë — vetëm sm+ */}
            <div className="hidden items-center gap-3 text-sm sm:flex">
              <Link href="/notifications" className="underline">
                🔔{unreadCountQuery.data ? ` ${unreadCountQuery.data}` : ""}
              </Link>
              <Link href="/reservations" className="underline">
                Rezervimet e mia
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" className="underline">
                  Paneli admin
                </Link>
              )}
              <span className="text-muted-foreground">{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Dil
              </Button>
            </div>

            {/* Hamburger — vetëm mobile */}
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-md border text-sm sm:hidden"
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          </>
        ) : (
          <Link href="/login" className="text-sm underline">
            Kyçu
          </Link>
        )}
      </div>

      {user && menuOpen && (
        <div className="mt-3 flex flex-col gap-3 text-sm sm:hidden">
          <Link
            href="/notifications"
            className="underline"
            onClick={() => setMenuOpen(false)}
          >
            🔔 Njoftimet
            {unreadCountQuery.data ? ` (${unreadCountQuery.data})` : ""}
          </Link>
          <Link
            href="/reservations"
            className="underline"
            onClick={() => setMenuOpen(false)}
          >
            Rezervimet e mia
          </Link>
          {user.role === "admin" && (
            <Link
              href="/admin"
              className="underline"
              onClick={() => setMenuOpen(false)}
            >
              Paneli admin
            </Link>
          )}
          <span className="text-muted-foreground">{user.email}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Dil
          </Button>
        </div>
      )}
    </header>
  );
}
