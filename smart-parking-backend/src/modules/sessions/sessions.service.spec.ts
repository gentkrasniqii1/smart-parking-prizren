import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { NotificationType, SessionSource, SpotStatus } from '@prisma/client';
import { SessionsService } from './sessions.service.js';

describe('SessionsService', () => {
  let service: SessionsService;
  let tx: {
    parkingSession: { findFirst: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    reservation: { findFirst: ReturnType<typeof vi.fn> };
    $executeRaw: ReturnType<typeof vi.fn>;
  };
  let prisma: { $transaction: ReturnType<typeof vi.fn> };
  let spotsService: { findOne: ReturnType<typeof vi.fn> };
  let redisService: { publish: ReturnType<typeof vi.fn> };
  let notificationsService: { create: ReturnType<typeof vi.fn> };

  const SPOT = {
    id: 'spot-1',
    code: 'A-01',
    status: SpotStatus.free,
    zoneId: 'zone-1',
    location: { type: 'Point' as const, coordinates: [20.74, 42.21] as [number, number] },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    tx = {
      parkingSession: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: 'session-1',
          spotId: SPOT.id,
          userId: 'user-1',
          checkIn: new Date(),
          checkOut: null,
          source: SessionSource.manual,
        }),
        update: vi.fn().mockResolvedValue({
          id: 'session-1',
          spotId: SPOT.id,
          userId: 'user-1',
          checkIn: new Date(),
          checkOut: new Date(),
          source: SessionSource.manual,
        }),
      },
      reservation: { findFirst: vi.fn().mockResolvedValue(null) },
      $executeRaw: vi.fn().mockResolvedValue(1),
    };

    prisma = { $transaction: vi.fn((cb: (tx: unknown) => unknown) => cb(tx)) };
    spotsService = { findOne: vi.fn().mockResolvedValue(SPOT) };
    redisService = { publish: vi.fn().mockResolvedValue(1) };
    notificationsService = { create: vi.fn().mockResolvedValue(undefined) };

    service = new SessionsService(
      prisma as never,
      spotsService as never,
      redisService as never,
      notificationsService as never,
    );
  });

  describe('checkIn', () => {
    it('creates a session and publishes the update when the spot is free', async () => {
      const result = await service.checkIn('user-1', { spotId: SPOT.id });

      expect(tx.parkingSession.create).toHaveBeenCalledWith({
        data: { spotId: SPOT.id, userId: 'user-1', source: SessionSource.manual },
      });
      expect(redisService.publish).toHaveBeenCalled();
      expect(notificationsService.create).toHaveBeenCalledWith(
        'user-1',
        NotificationType.checkin,
        expect.stringContaining(SPOT.code),
      );
      expect(result.id).toBe('session-1');
    });

    it('rejects when the user already has an active session elsewhere', async () => {
      tx.parkingSession.findFirst.mockResolvedValueOnce({ id: 'other-session' });

      await expect(service.checkIn('user-1', { spotId: SPOT.id })).rejects.toThrow(
        ConflictException,
      );
      expect(tx.$executeRaw).not.toHaveBeenCalled();
    });

    it("rejects when someone else's reservation is active right now", async () => {
      tx.reservation.findFirst.mockResolvedValueOnce({ id: 'res-1' });

      await expect(service.checkIn('user-1', { spotId: SPOT.id })).rejects.toThrow(
        ConflictException,
      );
      expect(tx.$executeRaw).not.toHaveBeenCalled();
    });

    it('rejects when the compare-and-swap loses the race (spot no longer free)', async () => {
      tx.$executeRaw.mockResolvedValueOnce(0);

      await expect(service.checkIn('user-1', { spotId: SPOT.id })).rejects.toThrow(
        ConflictException,
      );
      expect(tx.parkingSession.create).not.toHaveBeenCalled();
    });
  });

  describe('checkOut', () => {
    it('closes the active session and publishes the update', async () => {
      tx.parkingSession.findFirst.mockResolvedValueOnce({
        id: 'session-1',
        spotId: SPOT.id,
      });

      const result = await service.checkOut('user-1');

      expect(tx.parkingSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: { checkOut: expect.any(Date) },
      });
      expect(notificationsService.create).toHaveBeenCalledWith(
        'user-1',
        NotificationType.checkout,
        expect.stringContaining(SPOT.code),
      );
      expect(result.id).toBe('session-1');
    });

    it('rejects when there is no active session for the user', async () => {
      await expect(service.checkOut('user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
