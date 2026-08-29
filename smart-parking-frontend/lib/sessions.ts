import { apiFetch } from "./api";
import type { ActiveSession, ParkingSession, SessionSource } from "./types";

export function checkIn(
  spotId: string,
  source?: SessionSource,
): Promise<ParkingSession> {
  return apiFetch<ParkingSession>("/sessions/check-in", {
    method: "POST",
    body: JSON.stringify({ spotId, source }),
  });
}

export function checkOut(): Promise<ParkingSession> {
  return apiFetch<ParkingSession>("/sessions/check-out", { method: "POST" });
}

export function getMyActiveSession(): Promise<ActiveSession | null> {
  return apiFetch<ActiveSession | null>("/sessions/me/active");
}
