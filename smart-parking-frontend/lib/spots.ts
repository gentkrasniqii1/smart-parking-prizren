import { apiFetch } from "./api";
import type { GeoPoint, Spot, SpotStatus } from "./types";

export function getSpots(zoneId?: string): Promise<Spot[]> {
  const query = zoneId ? `?zoneId=${encodeURIComponent(zoneId)}` : "";
  return apiFetch<Spot[]>(`/spots${query}`);
}

export function createSpot(data: {
  code: string;
  zoneId: string;
  location: GeoPoint;
  status?: SpotStatus;
}): Promise<Spot> {
  return apiFetch<Spot>("/spots", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Endpoint i ngushtë (vetëm status) i lejuar edhe për rolin `attendant` —
 * shih SpotsController.updateStatus. */
export function updateSpotStatusAsAttendant(
  id: string,
  status: SpotStatus,
): Promise<Spot> {
  return apiFetch<Spot>(`/spots/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function updateSpotStatus(
  id: string,
  status: SpotStatus,
): Promise<Spot> {
  return apiFetch<Spot>(`/spots/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteSpot(id: string): Promise<void> {
  return apiFetch<void>(`/spots/${id}`, { method: "DELETE" });
}
