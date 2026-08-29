import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, ReservationStatus, SpotStatus } from '@prisma/client';
import { ReservationsService } from './reservations.service.js';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let prisma: {
    reservation: {
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let spotsService: { findOne: ReturnType<typeof vi.fn> };
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

  const FUTURE_START = new Date(Date.now() + 60_000).toISOString();
  const FUTURE_END = new Date(Date.now() + 120_000).toISOString();

  beforeEach(() => {
    prisma = {
      reservation: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: 'res-1',
          spotId: SPOT.id,
          userId: 'user-1',
          startTime: new Date(FUTURE_START),
          endTime: new Date(FUTURE_END),
          status: ReservationStatus.confirmed,
        }),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };
    spotsService = { findOne: vi.fn().mockResolvedValue(SPOT) };
    notificationsService = { create: vi.fn().mockResolvedValue(undefined) };

    service = new ReservationsService(
      prisma as never,
      spotsService as never,
      notificationsService as never,
    );
  });

  describe('create', () => {
    it('rejects when endTime is not after startTime', async () => {
      await expect(
        service.create('user-1', {
          spotId: SPOT.id,
          startTime: FUTURE_END,
          endTime: FUTURE_START,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when startTime is in the past', async () => {
      const past = new Date(Date.now() - 60_000).toISOString();

      await expect(
        service.create('user-1', { spotId: SPOT.id, startTime: past, endTime: FUTURE_END }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when the spot is disabled', async () => {
      spotsService.findOne.mockResolvedValueOnce({ ...SPOT, status: SpotStatus.disabled });

      await expect(
        service.create('user-1', {
          spotId: SPOT.id,
          startTime: FUTURE_START,
          endTime: FUTURE_END,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects when the interval overlaps an existing confirmed reservation', async () => {
      prisma.reservation.findFirst.mockResolvedValueOnce({ id: 'existing' });

      await expect(
        service.create('user-1', {
          spotId: SPOT.id,
          startTime: FUTURE_START,
          endTime: FUTURE_END,
        }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.reservation.create).not.toHaveBeenCalled();
    });

    it('creates the reservation and notifies the user', async () => {
      const result = await service.create('user-1', {
        spotId: SPOT.id,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });

      expect(result.id).toBe('res-1');
      expect(notificationsService.create).toHaveBeenCalledWith(
        'user-1',
        NotificationType.reservation_confirmed,
        expect.stringContaining(SPOT.code),
      );
    });
  });

  describe('cancel', () => {
    it('rejects when the reservation does not exist', async () => {
      prisma.reservation.findUnique.mockResolvedValueOnce(null);

      await expect(service.cancel('user-1', 'missing')).rejects.toThrow(NotFoundException);
    });

    it("rejects when the reservation isn't the caller's", async () => {
      prisma.reservation.findUnique.mockResolvedValueOnce({
        id: 'res-1',
        userId: 'someone-else',
        status: ReservationStatus.confirmed,
      });

      await expect(service.cancel('user-1', 'res-1')).rejects.toThrow(ForbiddenException);
    });

    it('is idempotent when already cancelled, without sending a duplicate notification', async () => {
      const cancelled = {
        id: 'res-1',
        userId: 'user-1',
        status: ReservationStatus.cancelled,
      };
      prisma.reservation.findUnique.mockResolvedValueOnce(cancelled);

      const result = await service.cancel('user-1', 'res-1');

      expect(result).toBe(cancelled);
      expect(prisma.reservation.update).not.toHaveBeenCalled();
      expect(notificationsService.create).not.toHaveBeenCalled();
    });

    it('cancels an active reservation and notifies the user', async () => {
      prisma.reservation.findUnique.mockResolvedValueOnce({
        id: 'res-1',
        spotId: SPOT.id,
        userId: 'user-1',
        status: ReservationStatus.confirmed,
      });
      prisma.reservation.update.mockResolvedValueOnce({
        id: 'res-1',
        spotId: SPOT.id,
        userId: 'user-1',
        status: ReservationStatus.cancelled,
      });

      const result = await service.cancel('user-1', 'res-1');

      expect(result.status).toBe(ReservationStatus.cancelled);
      expect(notificationsService.create).toHaveBeenCalledWith(
        'user-1',
        NotificationType.reservation_cancelled,
        expect.stringContaining(SPOT.code),
      );
    });
  });
});
