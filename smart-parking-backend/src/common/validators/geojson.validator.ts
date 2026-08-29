import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

function isValidPosition(position: unknown): position is [number, number] {
  return (
    Array.isArray(position) &&
    position.length === 2 &&
    position.every((n) => typeof n === 'number' && Number.isFinite(n)) &&
    position[0] >= -180 &&
    position[0] <= 180 &&
    position[1] >= -90 &&
    position[1] <= 90
  );
}

@ValidatorConstraint({ name: 'isGeoJsonPointCoordinates', async: false })
export class IsGeoJsonPointCoordinatesConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return isValidPosition(value);
  }

  defaultMessage(): string {
    return 'coordinates duhet të jenë [gjatësia, gjerësia] të vlefshme ([-180,180], [-90,90])';
  }
}

export function IsGeoJsonPointCoordinates(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: IsGeoJsonPointCoordinatesConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'isGeoJsonPolygonCoordinates', async: false })
export class IsGeoJsonPolygonCoordinatesConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (!Array.isArray(value) || value.length === 0) {
      return false;
    }

    return value.every((ring: unknown) => {
      if (!Array.isArray(ring) || ring.length < 4) {
        return false;
      }
      if (!ring.every(isValidPosition)) {
        return false;
      }
      const [first, last] = [ring[0], ring[ring.length - 1]] as [
        number,
        number,
      ][];
      return first[0] === last[0] && first[1] === last[1];
    });
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} duhet të jetë një listë unazash (rings) GeoJSON të vlefshme, secila me ≥4 pika dhe të mbyllura (pika e parë = e fundit)`;
  }
}

export function IsGeoJsonPolygonCoordinates(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options,
      constraints: [],
      validator: IsGeoJsonPolygonCoordinatesConstraint,
    });
  };
}
