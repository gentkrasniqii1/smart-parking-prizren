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
