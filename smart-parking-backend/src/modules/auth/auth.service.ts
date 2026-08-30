import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { User } from '@prisma/client';
import { UsersService } from '../users/users.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { EmailService } from '../email/email.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { TokenPair } from './types/token-pair.type.js';
import { GoogleProfile } from './types/google-profile.type.js';

const BCRYPT_ROUNDS = 12;
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly auditLogService: AuditLogService,
    private readonly emailService: EmailService,
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

    // Fire-and-forget e qëllimshme: dërgimi i email-it s'duhet të bllokojë
    // apo dështojë regjistrimin (shih EmailService — vetë s'hedh gabim, por
    // mbrojtje shtesë këtu nëse ndryshon në të ardhmen).
    void this.sendVerificationEmail(user.id, user.email).catch(() => {});

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
          // Google e ka verifikuar tashmë email-in — s'ka kuptim t'i kërkojmë
          // përsëri verifikim me email nga ne.
          emailVerified: true,
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

  async sendVerificationEmail(userId: string, email: string): Promise<void> {
    const rawToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
    await this.usersService.setEmailVerificationToken(
      userId,
      hashToken(rawToken),
      expiresAt,
    );
    const verifyUrl = `${this.frontendBaseUrl()}/verify-email?token=${rawToken}`;
    await this.emailService.sendVerificationEmail(email, verifyUrl);
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user || user.emailVerified) {
      // Heshtazi — s'ka kuptim praktik ta zbulojmë gjendjen te klienti dhe
      // s'ka rrezik sigurie (endpoint kërkon JWT të vlefshëm të vetë userit).
      return;
    }
    await this.sendVerificationEmail(user.id, user.email);
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.usersService.findByValidEmailVerificationToken(
      hashToken(token),
    );
    if (!user) {
      throw new BadRequestException(
        'Lidhja e verifikimit është e pavlefshme ose ka skaduar',
      );
    }
    await this.usersService.markEmailVerified(user.id);
    await this.auditLogService.record('auth.email_verified', user.id, {
      email: user.email,
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Mos zbulo nëse email-i ekziston — kthehu heshtazi njësoj si te rasti
      // i suksesshëm (mbrojtje kundër user enumeration, shih AuthController).
      return;
    }

    const rawToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
    await this.usersService.setPasswordResetToken(
      user.id,
      hashToken(rawToken),
      expiresAt,
    );
    const resetUrl = `${this.frontendBaseUrl()}/reset-password?token=${rawToken}`;
    await this.emailService.sendPasswordResetEmail(user.email, resetUrl);
    await this.auditLogService.record('auth.password_reset_requested', user.id, {
      email: user.email,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findByValidPasswordResetToken(
      hashToken(token),
    );
    if (!user) {
      throw new BadRequestException(
        'Lidhja e rivendosjes është e pavlefshme ose ka skaduar',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.usersService.resetPassword(user.id, passwordHash);
    await this.auditLogService.record('auth.password_reset_completed', user.id, {
      email: user.email,
    });
  }

  private frontendBaseUrl(): string {
    const configured = this.config.get<string>('FRONTEND_URL');
    return configured?.split(',')[0]?.trim() || 'http://localhost:3000';
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: User['role'],
  ): Promise<TokenPair> {
    // `jti` unik: `iat` ka rezolucion vetëm sekonde (spec JWT), kështu që dy
    // thirrje issueTokens() brenda së njëjtës sekonde (p.sh. login i menjëhershëm
    // pas register, ose dy refresh rresht) do të prodhonin token identikë
    // bit-për-bit pa këtë — gjë që dobëson garancinë e "rotullimit" të
    // refresh token-it (zbuluar nga një flake në auth.e2e-spec.ts).
    const payload = { sub: userId, email, role, jti: randomBytes(16).toString('hex') };

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
