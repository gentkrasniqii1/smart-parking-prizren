import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SpotsService } from './spots.service.js';
import { CreateSpotDto } from './dto/create-spot.dto.js';
import { UpdateSpotDto } from './dto/update-spot.dto.js';
import { UpdateSpotStatusDto } from './dto/update-spot-status.dto.js';
import { FindSpotsQueryDto } from './dto/find-spots-query.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { RequestUser } from '../auth/types/request-user.type.js';

@ApiTags('spots')
@Controller('spots')
export class SpotsController {
  constructor(private readonly spotsService: SpotsService) {}

  @Get()
  findAll(@Query() query: FindSpotsQueryDto) {
    return this.spotsService.findAll(query.zoneId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.spotsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateSpotDto) {
    return this.spotsService.create(dto, user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSpotDto,
  ) {
    return this.spotsService.update(id, dto, user.userId);
  }

  // Endpoint i veçantë, i ngushtë qëllimisht (vetëm `status`) në vend që të
  // zgjerohej `PATCH /spots/:id` te rojtarët — parimi i privilegjit minimal:
  // rojtari duhet të shënojë një vendparkim jashtë funksionit/të lirë gjatë
  // punës në terren (§30/§45), POR jo të ndryshojë kodin, zonën apo
  // koordinatat e tij. Audit-logimi bëhet nga i njëjti SpotsService.update().
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'attendant')
  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSpotStatusDto,
  ) {
    return this.spotsService.update(id, dto, user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.spotsService.remove(id, user.userId);
  }
}
