import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Get,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard.js';
import { GoogleAuthGuard } from '../../common/guards/google-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RateLimit } from '../../common/decorators/rate-limit.decorator.js';
import type {
  RequestUser,
  RequestUserWithRefreshToken,
} from './types/request-user.type.js';
import type { GoogleProfile } from './types/google-profile.type.js';
import { toSafeUser } from '../users/user.mapper.js';
import { UsersService } from '../users/users.service.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  @RateLimit({ limit: 5, windowSec: 60 })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const { user, tokens } = await this.authService.register(dto);
    return { user: toSafeUser(user), ...tokens };
  }

  @RateLimit({ limit: 5, windowSec: 60 })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const { user, tokens } = await this.authService.login(dto);
    return { user: toSafeUser(user), ...tokens };
  }

  @ApiBearerAuth()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@CurrentUser() user: RequestUserWithRefreshToken) {
    return this.authService.refreshTokens(user.userId, user.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: RequestUser): Promise<void> {
    await this.authService.logout(user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: RequestUser) {
    const fullUser = await this.usersService.findById(user.userId);
    if (!fullUser) {
      throw new UnauthorizedException();
    }
    return toSafeUser(fullUser);
  }

  @RateLimit({ limit: 5, windowSec: 60 })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    // Mesazh identik pavarësisht nëse email-i ekziston — mbrojtje kundër
    // user enumeration (shih AuthService.forgotPassword).
    return {
      message:
        'Nëse ekziston një llogari me këtë email, do të marrësh një lidhje rivendosjeje.',
    };
  }

  @RateLimit({ limit: 5, windowSec: 60 })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: 'Fjalëkalimi u ndryshua me sukses.' };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto.token);
    return { message: 'Email-i u verifikua me sukses.' };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @RateLimit({ limit: 3, windowSec: 60 })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@CurrentUser() user: RequestUser) {
    await this.authService.resendVerificationEmail(user.userId);
    return { message: 'Nëse email-i s\'është verifikuar ende, u ridërgua lidhja.' };
  }

  // Guard-i vetë e nis redirect-in te ekrani i pëlqimit të Google — nuk
  // ekzekutohet kurrë trupi i handler-it.
  @ApiExcludeEndpoint()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  googleAuth() {}

  @ApiExcludeEndpoint()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as GoogleProfile | undefined;
    const frontendUrl = this.frontendBaseUrl();

    if (!profile) {
      res.redirect(`${frontendUrl}/login?error=google`);
      return;
    }

    const { tokens } = await this.authService.loginWithGoogle(profile);
    // Token-at kalojnë te frontend-i në URL fragment (#), jo query string —
    // fragment-i s'i dërgohet kurrë serverit/proxy-t, prandaj s'mbetet në
    // logje. Frontend-i (`/auth/callback`) i lexon me `window.location.hash`.
    const fragment = new URLSearchParams({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }).toString();
    res.redirect(`${frontendUrl}/auth/callback#${fragment}`);
  }

  private frontendBaseUrl(): string {
    const configured = this.config.get<string>('FRONTEND_URL');
    return configured?.split(',')[0]?.trim() || 'http://localhost:3000';
  }
}
