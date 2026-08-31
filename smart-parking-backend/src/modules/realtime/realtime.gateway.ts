import { Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { RedisService } from '../../redis/redis.service.js';
import {
  NOTIFICATION_CHANNEL,
  SPOT_STATUS_CHANNEL,
} from '../../redis/redis-channels.js';

interface ZoneRoomPayload {
  zoneId: string;
}

interface AccessTokenClaims {
  sub: string;
}

function userRoom(userId: string): string {
  return `user:${userId}`;
}

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnModuleInit
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    void this.redisService.subscriber.subscribe(
      SPOT_STATUS_CHANNEL,
      NOTIFICATION_CHANNEL,
    );
    this.redisService.subscriber.on(
      'message',
      (channel: string, message: string) => {
        if (channel === SPOT_STATUS_CHANNEL) {
          const spot = JSON.parse(message) as { zoneId: string };
          this.server.to(spot.zoneId).emit('spot:update', spot);
          return;
        }
        if (channel === NOTIFICATION_CHANNEL) {
          const payload = JSON.parse(message) as {
            userId: string;
            notification: unknown;
          };
          this.server
            .to(userRoom(payload.userId))
            .emit('notification:new', payload.notification);
        }
      },
    );
  }

  afterInit(): void {
    this.logger.log('WebSocket Gateway u nis');
  }

  // Lidhja mund të vijë pa token (harta publike s'kërkon auth) — vetëm nëse
  // token-i është i vlefshëm klienti bashkohet me room-in e vet privat për
  // njoftime. Dështimi i verifikimit s'e refuzon lidhjen, thjesht s'ka njoftime.
  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      return;
    }

    try {
      const claims = await this.jwtService.verifyAsync<AccessTokenClaims>(
        token,
        {
          secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        },
      );
      await client.join(userRoom(claims.sub));
    } catch {
      // token i pavlefshëm/skaduar — lidhja vazhdon si anonime
    }
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

  // Përdorur nga AdminService.getSystemHealth() — numri real i klientëve të
  // lidhur, jo i simuluar (§32/§39 e promptit: "asnjëherë mos fabriko gjendje
  // sistemi").
  getConnectedClientsCount(): number {
    return this.server.sockets.sockets.size;
  }
}
