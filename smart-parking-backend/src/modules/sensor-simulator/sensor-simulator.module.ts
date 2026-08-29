import { Module } from '@nestjs/common';
import { SensorSimulatorService } from './sensor-simulator.service.js';
import { SpotsModule } from '../spots/spots.module.js';

@Module({
  imports: [SpotsModule],
  providers: [SensorSimulatorService],
})
export class SensorSimulatorModule {}
