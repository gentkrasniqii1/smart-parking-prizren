import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createZone,
  deleteZone,
  getZone,
  getZones,
  updateZoneName,
} from "@/lib/zones";
import type { GeoPolygon } from "@/lib/types";

export function useZones() {
  return useQuery({ queryKey: ["zones"], queryFn: getZones });
}

export function useZone(id: string) {
  return useQuery({ queryKey: ["zones", id], queryFn: () => getZone(id) });
}

export function useCreateZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, polygon }: { name: string; polygon: GeoPolygon }) =>
      createZone(name, polygon),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["zones"] }),
  });
}

export function useUpdateZoneName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateZoneName(id, name),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["zones"] }),
  });
}

export function useDeleteZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteZone,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["zones"] }),
  });
}
