import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { UsersService } from '../users/users.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { TokenPair } from './types/token-pair.type.js';
import { GoogleProfile } from './types/google-profile.type.js';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: User; tokens: TokenPair }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(
        'Një përdorues me këtë email ekziston tashmë',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
    });
    const tokens = await this.issueTokens(user.id, user.email, user.role);
    await this.auditLogService.record('auth.register', user.id, {
      email: user.email,
    });
    return { user, tokens };
  }

  async login(dto: LoginDto): Promise<{ user: User; tokens: TokenPair }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      await this.auditLogService.record('auth.login_failed', null, {
        email: dto.email,
      });
      throw new UnauthorizedException('Kredenciale të pasakta');
    }

    // `passwordHash` mungon te user-at e krijuar vetëm përmes Google — trajto
    // si kredenciale të pasakta, jo si gabim (mos zbulo se llogaria është
    // Google-only, njësoj si te çdo email tjetër i panjohur).
    const passwordMatches = user.passwordHash
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : false;
    if (!passwordMatches) {
      await this.auditLogService.record('auth.login_failed', user.id, {
        email: dto.email,
      });
      throw new UnauthorizedException('Kredenciale të pasakta');
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    await this.auditLogService.record('auth.login', user.id, {
      email: user.email,
    });
    return { user, tokens };
  }

  async loginWithGoogle(
    profile: GoogleProfile,
  ): Promise<{ user: User; tokens: TokenPair }> {
    let user = await this.usersService.findByGoogleId(profile.googleId);

    if (!user) {
      const existingByEmail = await this.usersService.findByEmail(
        profile.email,
      );
      if (existingByEmail) {
        // Llogari lokale ekzistuese me të njëjtin email — lidh googleId-në
        // në vend të krijimit të një user-i të dytë (email-i është @unique).
        user = await this.usersService.linkGoogleId(
          existingByEmail.id,
          profile.googleId,
        );
      } else {
        user = await this.usersService.create({
          email: profile.email,
          googleId: profile.googleId,
        });
      }
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);
    await this.auditLogService.record('auth.google_login', user.id, {
      email: user.email,
    });
    return { user, tokens };
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<TokenPair> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Akses i refuzuar');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Akses i refuzuar');
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshTokenHash(userId, null);
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: User['role'],
  ): Promise<TokenPair> {
    const payload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.getExpiresIn('JWT_ACCESS_EXPIRES_IN', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.getExpiresIn('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.usersService.updateRefreshTokenHash(userId, hashedRefreshToken);

    return { accessToken, refreshToken };
  }

  private getExpiresIn(
    key: string,
    fallback: string,
  ): JwtSignOptions['expiresIn'] {
    return this.config.get<string>(
      key,
      fallback,
    ) as JwtSignOptions['expiresIn'];
  }
}
