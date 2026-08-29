import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSpot,
  deleteSpot,
  getSpots,
  updateSpotStatus,
} from "@/lib/spots";
import type { GeoPoint, SpotStatus } from "@/lib/types";

export function useSpots(zoneId?: string) {
  return useQuery({
    queryKey: ["spots", zoneId ?? "all"],
    queryFn: () => getSpots(zoneId),
  });
}

export function useCreateSpot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      code: string;
      zoneId: string;
      location: GeoPoint;
      status?: SpotStatus;
    }) => createSpot(data),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["spots"] }),
  });
}

export function useUpdateSpotStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SpotStatus }) =>
      updateSpotStatus(id, status),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["spots"] }),
  });
}

export function useDeleteSpot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSpot,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["spots"] }),
  });
}
