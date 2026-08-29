import { IsOptional, IsUUID } from 'class-validator';

export class FindSpotsQueryDto {
  @IsOptional()
  @IsUUID()
  zoneId?: string;
}
