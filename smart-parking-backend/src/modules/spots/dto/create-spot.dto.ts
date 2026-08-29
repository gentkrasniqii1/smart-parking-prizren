import { Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SpotStatus } from '@prisma/client';
import { GeoPointDto } from '../../../common/dto/geo-point.dto.js';

export class CreateSpotDto {
  @IsString()
  @MinLength(1)
  code!: string;

  @IsUUID()
  zoneId!: string;

  @ValidateNested()
  @Type(() => GeoPointDto)
  location!: GeoPointDto;

  @IsOptional()
  @IsEnum(SpotStatus)
  status?: SpotStatus;
}
