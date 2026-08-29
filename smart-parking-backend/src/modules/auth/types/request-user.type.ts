import { Role } from '@prisma/client';

export interface RequestUser {
  userId: string;
  email: string;
  role: Role;
}

export interface RequestUserWithRefreshToken extends RequestUser {
  refreshToken: string;
}
