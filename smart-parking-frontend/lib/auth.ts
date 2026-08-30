import { apiFetch } from "./api";
import type { AuthUser, TokenPair } from "./types";

interface AuthResponse extends TokenPair {
  user: AuthUser;
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuthRetry: true,
  });
}

export function register(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuthRetry: true,
  });
}

export function logout(): Promise<void> {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}

export function getMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/auth/me");
}

export function forgotPassword(email: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
    skipAuthRetry: true,
  });
}

export function resetPassword(
  token: string,
  password: string,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
    skipAuthRetry: true,
  });
}

export function verifyEmail(token: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
    skipAuthRetry: true,
  });
}

export function resendVerification(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/resend-verification", {
    method: "POST",
  });
}
