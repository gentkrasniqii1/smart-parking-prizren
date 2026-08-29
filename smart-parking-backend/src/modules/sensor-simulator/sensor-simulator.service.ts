import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { SpotStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RedisService } from '../../redis/redis.service.js';
import { SPOT_STATUS_CHANNEL } from '../../redis/redis-channels.js';
import { SpotsService } from '../spots/spots.service.js';

const DEFAULT_INTERVAL_MS = 8000;
const MIN_SPOTS_PER_TICK = 1;
const MAX_SPOTS_PER_TICK = 2;

function toggle(status: SpotStatus): SpotStatus {
  return status === SpotStatus.free ? SpotStatus.occupied : SpotStatus.free;
}

@Injectable()
export class SensorSimulatorService implements OnModuleInit {
  private readonly logger = new Logger(SensorSimulatorService.name);
  private readonly enabled: boolean;

  constructor(
    private readonly spotsService: SpotsService,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly config: ConfigService,
  ) {
    this.enabled =
      this.config.get<string>('SENSOR_SIMULATOR_ENABLED', 'true') !== 'false';
  }

  onModuleInit(): void {
    if (this.enabled) {
      this.logger.log('Sensor simulator aktiv');
    } else {
      this.logger.log(
        'Sensor simulator i çaktivizuar (SENSOR_SIMULATOR_ENABLED=false)',
      );
    }
  }

  @Interval(
    Number(process.env.SENSOR_SIMULATOR_INTERVAL_MS) || DEFAULT_INTERVAL_MS,
  )
  async tick(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const count =
      MIN_SPOTS_PER_TICK +
      Math.floor(Math.random() * (MAX_SPOTS_PER_TICK - MIN_SPOTS_PER_TICK + 1));
    const candidates = await this.spotsService.findRandomTogglable(count);

    for (const spot of candidates) {
      const newStatus = toggle(spot.status);
      const updated = await this.spotsService.update(spot.id, {
        status: newStatus,
      });

      await this.prisma.sensorEvent.create({
        data: { spotId: spot.id, status: newStatus },
      });

      await this.redisService.publish(SPOT_STATUS_CHANNEL, updated);
    }
  }
}
