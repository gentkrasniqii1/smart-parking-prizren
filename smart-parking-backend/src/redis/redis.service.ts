import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly publisher: Redis;
  readonly subscriber: Redis;

  constructor(config: ConfigService) {
    const url = config.getOrThrow<string>('REDIS_URL');
    this.publisher = new Redis(url);
    this.subscriber = new Redis(url);
  }

  publish(channel: string, message: unknown): Promise<number> {
    return this.publisher.publish(channel, JSON.stringify(message));
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([this.publisher.quit(), this.subscriber.quit()]);
  }
}
