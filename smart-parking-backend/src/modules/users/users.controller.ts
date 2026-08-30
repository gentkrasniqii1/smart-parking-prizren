import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';
import { toAdminUserListItem, toSafeUser } from './user.mapper.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { RequestUser } from '../auth/types/request-user.type.js';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Get()
  async findAll() {
    const users = await this.usersService.findAllWithCounts();
    return users.map(toAdminUserListItem);
  }

  @Patch(':id/role')
  async updateRole(
    @CurrentUser() actor: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    if (actor.userId === id) {
      // Vetë-degradim/promovim aksidental do të linte panelin në gjendje të
      // pakuptimtë (p.sh. admin heq vetes rolin admin dhe humbet akses te
      // vetë ky endpoint) — kërkohet një admin tjetër ta bëjë ndryshimin.
      throw new ForbiddenException(
        'S\'mund ta ndryshosh rolin e llogarisë tënde',
      );
    }

    const target = await this.usersService.findById(id);
    if (!target) {
      throw new NotFoundException('Përdoruesi nuk u gjet');
    }

    const updated = await this.usersService.updateRole(id, dto.role);
    await this.auditLogService.record('admin.user_role_changed', actor.userId, {
      targetUserId: target.id,
      targetEmail: target.email,
      oldRole: target.role,
      newRole: dto.role,
    });
    return toSafeUser(updated);
  }
}
