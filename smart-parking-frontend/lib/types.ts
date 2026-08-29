export interface GeoPoint {
  type: "Point";
  coordinates: [number, number];
}

export interface GeoPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

export type SpotStatus = "free" | "occupied" | "reserved" | "disabled";

export interface Zone {
  id: string;
  name: string;
  polygon: GeoPolygon;
  createdAt: string;
  updatedAt: string;
}

export interface Spot {
  id: string;
  code: string;
  location: GeoPoint;
  status: SpotStatus;
  zoneId: string;
  createdAt: string;
  updatedAt: string;
}
