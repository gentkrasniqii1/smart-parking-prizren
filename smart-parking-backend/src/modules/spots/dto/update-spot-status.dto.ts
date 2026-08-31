import { IsEnum } from 'class-validator';
import { SpotStatus } from '@prisma/client';

export class UpdateSpotStatusDto {
  @IsEnum(SpotStatus)
  status!: SpotStatus;
}
