import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service.js';
import { AnalyticsQueryDto } from './dto/analytics-query.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('system-health')
  getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  @Get('alerts')
  getAlerts() {
    return this.adminService.getAlerts();
  }

  @Get('analytics/heatmap')
  getHeatmap(@Query() query: AnalyticsQueryDto) {
    return this.adminService.getHeatmap(query.days ?? 7);
  }

  @Get('analytics/peak-hours')
  getPeakHours(@Query() query: AnalyticsQueryDto) {
    return this.adminService.getPeakHours(query.days ?? 7);
  }
}
