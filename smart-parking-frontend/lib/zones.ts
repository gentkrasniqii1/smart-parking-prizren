import { apiFetch } from "./api";
import type { Zone } from "./types";

export function getZones(): Promise<Zone[]> {
  return apiFetch<Zone[]>("/zones");
}

export function getZone(id: string): Promise<Zone> {
  return apiFetch<Zone>(`/zones/${id}`);
}
