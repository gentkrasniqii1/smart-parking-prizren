import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { checkIn, checkOut, getMyActiveSession } from "@/lib/sessions";
import { useAuthStore } from "@/store/useAuthStore";
import type { SessionSource } from "@/lib/types";

export function useActiveSession() {
  const isLoggedIn = useAuthStore((state) => !!state.accessToken);

  return useQuery({
    queryKey: ["sessions", "active"],
    queryFn: getMyActiveSession,
    enabled: isLoggedIn,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      spotId,
      source,
    }: {
      spotId: string;
      source?: SessionSource;
    }) => checkIn(spotId, source),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sessions", "active"] });
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: checkOut,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sessions", "active"] });
    },
  });
}
