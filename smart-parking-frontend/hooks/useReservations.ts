import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelReservation,
  createReservation,
  getMyReservations,
  getUpcomingReservationsForSpot,
} from "@/lib/reservations";
import { useAuthStore } from "@/store/useAuthStore";

export function useMyReservations() {
  const isLoggedIn = useAuthStore((state) => !!state.accessToken);

  return useQuery({
    queryKey: ["reservations", "me"],
    queryFn: getMyReservations,
    enabled: isLoggedIn,
  });
}

export function useSpotUpcomingReservations(spotId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["reservations", "spot", spotId],
    queryFn: () => getUpcomingReservationsForSpot(spotId),
    enabled,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      spotId,
      startTime,
      endTime,
    }: {
      spotId: string;
      startTime: string;
      endTime: string;
    }) => createReservation(spotId, startTime, endTime),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["reservations", "me"] });
      void queryClient.invalidateQueries({
        queryKey: ["reservations", "spot", variables.spotId],
      });
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelReservation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
}
