import { IsIn } from 'class-validator';
import { IsGeoJsonPolygonCoordinates } from '../validators/geojson.validator.js';

export class GeoPolygonDto {
  @IsIn(['Polygon'])
  type!: 'Polygon';

  @IsGeoJsonPolygonCoordinates()
  coordinates!: number[][][];
}
