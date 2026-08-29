import { apiFetch } from "./api";
import type { Reservation, ReservationWindow } from "./types";

export function createReservation(
  spotId: string,
  startTime: string,
  endTime: string,
): Promise<Reservation> {
  return apiFetch<Reservation>("/reservations", {
    method: "POST",
    body: JSON.stringify({ spotId, startTime, endTime }),
  });
}

export function getMyReservations(): Promise<Reservation[]> {
  return apiFetch<Reservation[]>("/reservations/me");
}

export function cancelReservation(id: string): Promise<Reservation> {
  return apiFetch<Reservation>(`/reservations/${id}/cancel`, {
    method: "POST",
  });
}

export function getUpcomingReservationsForSpot(
  spotId: string,
): Promise<ReservationWindow[]> {
  return apiFetch<ReservationWindow[]>(`/reservations/spot/${spotId}/upcoming`);
}
