import { apiFetch } from "./api";
import type { GeoPolygon, Zone } from "./types";

export function getZones(): Promise<Zone[]> {
  return apiFetch<Zone[]>("/zones");
}

export function getZone(id: string): Promise<Zone> {
  return apiFetch<Zone>(`/zones/${id}`);
}

export function createZone(name: string, polygon: GeoPolygon): Promise<Zone> {
  return apiFetch<Zone>("/zones", {
    method: "POST",
    body: JSON.stringify({ name, polygon }),
  });
}

export function updateZoneName(id: string, name: string): Promise<Zone> {
  return apiFetch<Zone>(`/zones/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function deleteZone(id: string): Promise<void> {
  return apiFetch<void>(`/zones/${id}`, { method: "DELETE" });
}
