import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { SessionSource } from '@prisma/client';

export class CheckInDto {
  @IsUUID()
  spotId!: string;

  @IsOptional()
  @IsIn([SessionSource.manual, SessionSource.qr])
  source?: typeof SessionSource.manual | typeof SessionSource.qr;
}
