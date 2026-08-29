"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { logout as apiLogout } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function Header() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  async function handleLogout() {
    try {
      await apiLogout();
    } catch {
      // token-i mund të jetë skaduar tashmë; s'ka rëndësi, po e pastrojmë gjithsesi
    }
    clearSession();
    router.push("/");
  }

  return (
    <header className="flex items-center justify-between border-b px-4 py-3 md:px-8">
      <Link href="/" className="font-semibold">
        Smart Parking Prizren
      </Link>

      {user ? (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{user.email}</span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Dil
          </Button>
        </div>
      ) : (
        <Link href="/login" className="text-sm underline">
          Kyçu
        </Link>
      )}
    </header>
  );
}
