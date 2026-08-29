import { Module } from '@nestjs/common';
import { SpotsController } from './spots.controller.js';
import { SpotsService } from './spots.service.js';
import { ZonesModule } from '../zones/zones.module.js';
import { AuditLogModule } from '../audit-log/audit-log.module.js';

@Module({
  imports: [ZonesModule, AuditLogModule],
  controllers: [SpotsController],
  providers: [SpotsService],
  exports: [SpotsService],
})
export class SpotsModule {}
