import { Module } from '@nestjs/common';
import { SpotsController } from './spots.controller.js';
import { SpotsService } from './spots.service.js';
import { ZonesModule } from '../zones/zones.module.js';

@Module({
  imports: [ZonesModule],
  controllers: [SpotsController],
  providers: [SpotsService],
  exports: [SpotsService],
})
export class SpotsModule {}
