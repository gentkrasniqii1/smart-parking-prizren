import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy.js';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy.js';
import { GoogleStrategy } from './strategies/google.strategy.js';
import { UsersModule } from '../users/users.module.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [UsersModule, JwtModule.register({}), AuditLogModule, EmailModule],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy, JwtRefreshStrategy, GoogleStrategy],
})
export class AuthModule {}
