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

export type Role = "citizen" | "attendant" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export type SessionSource = "sensor" | "manual" | "qr";

export interface ParkingSession {
  id: string;
  spotId: string;
  userId: string | null;
  checkIn: string;
  checkOut: string | null;
  source: SessionSource;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveSession {
  session: ParkingSession;
  spot: Spot;
}
