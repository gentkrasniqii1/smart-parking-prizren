import { Logger, type OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { RedisService } from '../../redis/redis.service.js';
import { SPOT_STATUS_CHANNEL } from '../../redis/redis-channels.js';

interface ZoneRoomPayload {
  zoneId: string;
}

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class RealtimeGateway implements OnGatewayInit, OnModuleInit {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly redisService: RedisService) {}

  onModuleInit(): void {
    void this.redisService.subscriber.subscribe(SPOT_STATUS_CHANNEL);
    this.redisService.subscriber.on(
      'message',
      (channel: string, message: string) => {
        if (channel !== SPOT_STATUS_CHANNEL) {
          return;
        }
        const spot = JSON.parse(message) as { zoneId: string };
        this.server.to(spot.zoneId).emit('spot:update', spot);
      },
    );
  }

  afterInit(): void {
    this.logger.log('WebSocket Gateway u nis');
  }

  @SubscribeMessage('zone:join')
  handleZoneJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ZoneRoomPayload,
  ): void {
    void client.join(payload.zoneId);
  }

  @SubscribeMessage('zone:leave')
  handleZoneLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ZoneRoomPayload,
  ): void {
    void client.leave(payload.zoneId);
  }
}
