import { Type } from 'class-transformer';
import { IsString, MinLength, ValidateNested } from 'class-validator';
import { GeoPolygonDto } from '../../../common/dto/geo-polygon.dto.js';

export class CreateZoneDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @ValidateNested()
  @Type(() => GeoPolygonDto)
  polygon!: GeoPolygonDto;
}
