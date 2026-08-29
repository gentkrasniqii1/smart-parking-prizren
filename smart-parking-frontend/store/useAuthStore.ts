import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser, TokenPair } from "@/lib/types";

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (user: AuthUser, tokens: TokenPair) => void;
  updateTokens: (tokens: TokenPair) => void;
  clearSession: () => void;
}

// E thjeshtëzuar për qëllime demo/portofoli: token-at ruhen në localStorage
// (jo httpOnly cookie) — më e lehtë për t'u zbatuar te backend-i aktual, që
// i kthen tokenat në trupin JSON. Forcim i httpOnly cookie do të ishte
// hardening-u i duhur për prodhim (shënim për Fazën 10 nëse duhet).
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: (user, tokens) =>
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }),
      updateTokens: (tokens) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }),
      clearSession: () =>
        set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: "smart-parking-auth" },
  ),
);
