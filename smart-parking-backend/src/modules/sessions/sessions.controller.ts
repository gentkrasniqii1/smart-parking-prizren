import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SessionsService } from './sessions.service.js';
import { CheckInDto } from './dto/check-in.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { RequestUser } from '../auth/types/request-user.type.js';

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('check-in')
  checkIn(@CurrentUser() user: RequestUser, @Body() dto: CheckInDto) {
    return this.sessionsService.checkIn(user.userId, dto);
  }

  @Post('check-out')
  @HttpCode(HttpStatus.OK)
  checkOut(@CurrentUser() user: RequestUser) {
    return this.sessionsService.checkOut(user.userId);
  }

  @Get('me/active')
  findMyActiveSession(@CurrentUser() user: RequestUser) {
    return this.sessionsService.findActiveForUser(user.userId);
  }
}
