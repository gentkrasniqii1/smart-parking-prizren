"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, BadgeX } from "lucide-react";
import { useAdminUsers, useUpdateUserRole } from "@/hooks/useAdminUsers";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiError } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortableHeader } from "@/components/dashboard/SortableHeader";
import { DataTablePagination } from "@/components/dashboard/DataTablePagination";
import { cn } from "@/lib/utils";
import type { AdminUserListItem, Role } from "@/lib/types";

const PAGE_SIZE = 8;
type SortKey = "email" | "createdAt";

const ROLE_LABELS: Record<Role, string> = {
  citizen: "Qytetar",
  attendant: "Rojtar",
  admin: "Admin",
};

export function UsersPanel() {
  const currentUser = useAuthStore((state) => state.user);
  const usersQuery = useAdminUsers(true);
  const updateRole = useUpdateUserRole();
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const users = usersQuery.data ?? [];
    const sorted = [...users].sort((a, b) => {
      const cmp =
        sortKey === "email"
          ? a.email.localeCompare(b.email)
          : a.createdAt.localeCompare(b.createdAt);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [usersQuery.data, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  }

  function handleRoleChange(user: AdminUserListItem, role: Role) {
    if (role === user.role) {
      return;
    }
    updateRole.mutate(
      { id: user.id, role },
      {
        onSuccess: () =>
          toast.success(`Roli i ${user.email} u ndryshua në ${ROLE_LABELS[role]}`),
        onError: (err) =>
          toast.error(
            err instanceof ApiError
              ? "S'u ndryshua dot roli"
              : "Diçka shkoi keq",
          ),
      },
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Përdoruesit</h1>
      </div>

      {usersQuery.isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ende s&apos;ka përdorues.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader
                  sortKey="email"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={handleSort}
                >
                  Email
                </SortableHeader>
                <TableHead>Roli</TableHead>
                <TableHead>Verifikuar</TableHead>
                <TableHead>Rezervime</TableHead>
                <TableHead>Sesione</TableHead>
                <SortableHeader
                  sortKey="createdAt"
                  activeKey={sortKey}
                  direction={sortDir}
                  onSort={handleSort}
                >
                  Krijuar
                </SortableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((user) => {
                const isSelf = user.id === currentUser?.id;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) =>
                          handleRoleChange(user, value as Role)
                        }
                        disabled={isSelf || updateRole.isPending}
                      >
                        <SelectTrigger
                          size="sm"
                          aria-label={`Roli i ${user.email}`}
                          title={isSelf ? "S'mund ta ndryshosh rolin tënd" : undefined}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
                            <SelectItem key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                          user.emailVerified
                            ? "bg-status-free-bg text-status-free-fg"
                            : "bg-status-disabled-bg text-status-disabled-fg",
                        )}
                      >
                        {user.emailVerified ? (
                          <BadgeCheck className="size-3.5" />
                        ) : (
                          <BadgeX className="size-3.5" />
                        )}
                        {user.emailVerified ? "Po" : "Jo"}
                      </span>
                    </TableCell>
                    <TableCell>{user.reservationCount}</TableCell>
                    <TableCell>{user.sessionCount}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("sq-AL")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <DataTablePagination
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        totalItems={rows.length}
      />
    </section>
  );
}
