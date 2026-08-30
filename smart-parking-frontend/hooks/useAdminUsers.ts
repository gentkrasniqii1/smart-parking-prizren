import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminUsers, updateUserRole } from "@/lib/admin";
import type { Role } from "@/lib/types";

export function useAdminUsers(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: getAdminUsers,
    enabled,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      updateUserRole(id, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "auditLogs"] });
    },
  });
}
