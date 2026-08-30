import { Injectable } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  create(data: {
    email: string;
    passwordHash?: string;
    googleId?: string;
    role?: Role;
    emailVerified?: boolean;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  linkGoogleId(userId: string, googleId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { googleId },
    });
  }

  updateRefreshTokenHash(
    userId: string,
    hashedRefreshToken: string | null,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });
  }

  setEmailVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: expiresAt,
      },
    });
  }

  findByValidEmailVerificationToken(tokenHash: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: { gt: new Date() },
      },
    });
  }

  markEmailVerified(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      },
    });
  }

  setPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    });
  }

  findByValidPasswordResetToken(tokenHash: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });
  }

  // Rivendos fjalëkalimin dhe pastron token-in NJËKOHËSISHT me revokimin e
  // refresh token-it — një rivendosje fjalëkalimi duhet të çkyçë çdo sesion
  // tjetër aktiv (mbrojtje nëse llogaria ishte kompromentuar).
  resetPassword(userId: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        hashedRefreshToken: null,
      },
    });
  }

  findAllWithCounts() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { reservations: true, sessions: true } },
      },
    });
  }

  updateRole(userId: string, role: Role): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }
}
