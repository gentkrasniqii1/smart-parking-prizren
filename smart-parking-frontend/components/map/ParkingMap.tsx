"use client";

import { useMemo, useState } from "react";
import {
  Map,
  Source,
  Layer,
  Popup,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import type { FeatureCollection, Point, Polygon } from "geojson";
import type { LngLatBoundsLike, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Spot, SpotStatus, Zone } from "@/lib/types";

const PRIZREN_CENTER = { longitude: 20.7397, latitude: 42.2139 };

// Stil bosh, pa varësi rrjeti (pa kërkesa tile/sprite/glyph) — parashikueshëm
// dhe i lehtë. Zëvendësohet me një provider real (MapTiler, OSM raster,
// vetë-hostuar, etj.) kur zgjidhet një si pjesë e "polish"-it (Faza 10).
const BLANK_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#e8edf2" },
    },
  ],
};

const STATUS_COLORS: Record<SpotStatus, string> = {
  free: "#22c55e",
  occupied: "#ef4444",
  reserved: "#f59e0b",
  disabled: "#6b7280",
};

const STATUS_LABELS: Record<SpotStatus, string> = {
  free: "I lirë",
  occupied: "I zënë",
  reserved: "I rezervuar",
  disabled: "Jashtë funksionit",
};

interface ParkingMapProps {
  zones: Zone[];
  spots: Spot[];
  height?: string;
}

function zonesToFeatureCollection(
  zones: Zone[],
): FeatureCollection<Polygon, { id: string; name: string }> {
  return {
    type: "FeatureCollection",
    features: zones.map((zone) => ({
      type: "Feature",
      geometry: zone.polygon,
      properties: { id: zone.id, name: zone.name },
    })),
  };
}

function spotsToFeatureCollection(
  spots: Spot[],
): FeatureCollection<Point, { id: string; code: string; status: SpotStatus }> {
  return {
    type: "FeatureCollection",
    features: spots.map((spot) => ({
      type: "Feature",
      geometry: spot.location,
      properties: { id: spot.id, code: spot.code, status: spot.status },
    })),
  };
}

function computeBounds(zones: Zone[], spots: Spot[]): LngLatBoundsLike | null {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  function extend(lng: number, lat: number) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }

  for (const zone of zones) {
    for (const ring of zone.polygon.coordinates) {
      for (const [lng, lat] of ring) {
        extend(lng, lat);
      }
    }
  }
  for (const spot of spots) {
    extend(spot.location.coordinates[0], spot.location.coordinates[1]);
  }

  if (!Number.isFinite(minLng)) {
    return null;
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

export function ParkingMap({
  zones,
  spots,
  height = "600px",
}: ParkingMapProps) {
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

  const zonesData = useMemo(() => zonesToFeatureCollection(zones), [zones]);
  const spotsData = useMemo(() => spotsToFeatureCollection(spots), [spots]);
  const bounds = useMemo(() => computeBounds(zones, spots), [zones, spots]);

  function handleClick(event: MapLayerMouseEvent) {
    const feature = event.features?.[0];
    if (!feature || feature.layer?.id !== "spots-circle") {
      setSelectedSpot(null);
      return;
    }
    const spotId = feature.properties?.id as string | undefined;
    setSelectedSpot(spots.find((spot) => spot.id === spotId) ?? null);
  }

  return (
    <div
      style={{ height, width: "100%" }}
      className="relative overflow-hidden rounded-lg border"
    >
      <Map
        initialViewState={
          bounds
            ? { bounds, fitBoundsOptions: { padding: 48 } }
            : {
                longitude: PRIZREN_CENTER.longitude,
                latitude: PRIZREN_CENTER.latitude,
                zoom: 14,
              }
        }
        mapStyle={BLANK_STYLE}
        interactiveLayerIds={["spots-circle"]}
        onClick={handleClick}
      >
        <Source id="zones" type="geojson" data={zonesData}>
          <Layer
            id="zones-fill"
            type="fill"
            paint={{ "fill-color": "#3b82f6", "fill-opacity": 0.12 }}
          />
          <Layer
            id="zones-outline"
            type="line"
            paint={{ "line-color": "#3b82f6", "line-width": 2 }}
          />
        </Source>

        <Source id="spots" type="geojson" data={spotsData}>
          <Layer
            id="spots-circle"
            type="circle"
            paint={{
              "circle-radius": 7,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
              "circle-color": [
                "match",
                ["get", "status"],
                "free",
                STATUS_COLORS.free,
                "occupied",
                STATUS_COLORS.occupied,
                "reserved",
                STATUS_COLORS.reserved,
                "disabled",
                STATUS_COLORS.disabled,
                STATUS_COLORS.free,
              ],
            }}
          />
        </Source>

        {selectedSpot && (
          <Popup
            longitude={selectedSpot.location.coordinates[0]}
            latitude={selectedSpot.location.coordinates[1]}
            onClose={() => setSelectedSpot(null)}
            closeOnClick={false}
            anchor="bottom"
          >
            <div className="text-sm">
              <p className="font-semibold">{selectedSpot.code}</p>
              <p>{STATUS_LABELS[selectedSpot.status]}</p>
            </div>
          </Popup>
        )}
      </Map>
      <StatusLegend />
    </div>
  );
}

function StatusLegend() {
  return (
    <div className="pointer-events-none absolute top-3 right-3 z-10">
      <div className="pointer-events-auto flex flex-col gap-1 rounded-md border bg-background/90 p-2 text-xs shadow-sm">
        {(Object.keys(STATUS_LABELS) as SpotStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full border border-white"
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
            <span>{STATUS_LABELS[status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
