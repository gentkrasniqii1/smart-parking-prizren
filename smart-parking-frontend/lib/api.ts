import { useAuthStore } from "@/store/useAuthStore";
import type { TokenPair } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiFetchOptions extends RequestInit {
  /** S'provon rifreskim token-i pas 401 (përdoret nga vetë login/register). */
  skipAuthRetry?: boolean;
}

function rawFetch(path: string, init: RequestInit): Promise<Response> {
  const accessToken = useAuthStore.getState().accessToken;
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });
}

async function parseBody<T>(res: Response): Promise<T> {
  const text = await res.text();
  // Trup bosh (p.sh. controller që kthen null, ose 204) → null, jo undefined:
  // React Query e injoron "undefined" si përditësim dhe mban cache-in e vjetër.
  return (text ? JSON.parse(text) : null) as T;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) {
    return false;
  }

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${refreshToken}` },
  });

  if (!res.ok) {
    useAuthStore.getState().clearSession();
    return false;
  }

  const tokens = (await res.json()) as TokenPair;
  useAuthStore.getState().updateTokens(tokens);
  return true;
}

/**
 * Bashkangjit token-in e aksesit automatikisht; nëse backend-i përgjigjet
 * 401, provon një rifreskim (via refresh token) dhe rikërkon një herë.
 */
export async function apiFetch<T>(
  path: string,
  init: ApiFetchOptions = {},
): Promise<T> {
  const { skipAuthRetry, ...rest } = init;
  let res = await rawFetch(path, rest);

  if (res.status === 401 && !skipAuthRetry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await rawFetch(path, rest);
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }

  return parseBody<T>(res);
}
