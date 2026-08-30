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
