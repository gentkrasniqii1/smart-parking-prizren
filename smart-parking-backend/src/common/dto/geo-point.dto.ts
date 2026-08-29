import { IsIn } from 'class-validator';
import { IsGeoJsonPointCoordinates } from '../validators/geojson.validator.js';

export class GeoPointDto {
  @IsIn(['Point'])
  type!: 'Point';

  @IsGeoJsonPointCoordinates()
  coordinates!: [number, number];
}
