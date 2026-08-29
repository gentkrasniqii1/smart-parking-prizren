import { apiFetch } from "./api";
import type { Spot } from "./types";

export function getSpots(zoneId?: string): Promise<Spot[]> {
  const query = zoneId ? `?zoneId=${encodeURIComponent(zoneId)}` : "";
  return apiFetch<Spot[]>(`/spots${query}`);
}
