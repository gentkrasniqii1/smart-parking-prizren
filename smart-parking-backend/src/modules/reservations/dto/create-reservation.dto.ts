import { IsISO8601, IsUUID } from 'class-validator';

export class CreateReservationDto {
  @IsUUID()
  spotId!: string;

  @IsISO8601()
  startTime!: string;

  @IsISO8601()
  endTime!: string;
}
