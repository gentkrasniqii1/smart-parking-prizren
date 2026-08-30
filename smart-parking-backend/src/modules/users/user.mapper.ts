import { User } from '@prisma/client';

export interface SafeUser {
  id: string;
  email: string;
  role: User['role'];
  emailVerified: boolean;
  createdAt: Date;
}

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

export interface AdminUserListItem extends SafeUser {
  reservationCount: number;
  sessionCount: number;
}

type UserWithCounts = User & {
  _count: { reservations: number; sessions: number };
};

export function toAdminUserListItem(user: UserWithCounts): AdminUserListItem {
  return {
    ...toSafeUser(user),
    reservationCount: user._count.reservations,
    sessionCount: user._count.sessions,
  };
}
