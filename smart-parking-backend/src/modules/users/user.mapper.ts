import { User } from '@prisma/client';

export interface SafeUser {
  id: string;
  email: string;
  role: User['role'];
  createdAt: Date;
}

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}
