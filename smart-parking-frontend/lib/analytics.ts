import { apiFetch } from "./api";
import type { HeatmapResponse, PeakHourBucket } from "./types";

export function getHeatmap(days: number): Promise<HeatmapResponse> {
  return apiFetch<HeatmapResponse>(`/admin/analytics/heatmap?days=${days}`);
}

export function getPeakHours(days: number): Promise<PeakHourBucket[]> {
  return apiFetch<PeakHourBucket[]>(`/admin/analytics/peak-hours?days=${days}`);
}
