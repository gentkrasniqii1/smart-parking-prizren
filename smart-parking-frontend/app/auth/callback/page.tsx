"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getMe } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthCallbackPage() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) {
      return;
    }
    ran.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");

    if (!accessToken || !refreshToken) {
      router.replace("/login?error=google");
      return;
    }

    useAuthStore.getState().updateTokens({ accessToken, refreshToken });

    getMe()
      .then((user) => {
        useAuthStore.getState().setSession(user, { accessToken, refreshToken });
        router.replace("/");
      })
      .catch(() => {
        useAuthStore.getState().clearSession();
        router.replace("/login?error=google");
      });
  }, [router]);

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        Duke përfunduar kyçjen...
      </div>
    </main>
  );
}
