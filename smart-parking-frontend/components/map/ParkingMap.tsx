"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Map as MapGL,
  Source,
  Layer,
  Popup,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import type { FeatureCollection, Point, Polygon } from "geojson";
import type { LngLatBoundsLike } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Spot, SpotStatus, Zone } from "@/lib/types";
import { BASEMAP_STYLE } from "@/lib/map-style";
import { STATUS_LABELS, STATUS_MARKER_COLORS } from "@/lib/status-colors";

const PRIZREN_CENTER = { longitude: 20.7397, latitude: 42.2139 };
const FLASH_DURATION_MS = 1200;

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
      id: spot.id,
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
  const mapRef = useRef<MapRef>(null);
  const prevStatusRef = useRef<Map<string, SpotStatus>>(new Map());
  const flashTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const zonesData = useMemo(() => zonesToFeatureCollection(zones), [zones]);
  const spotsData = useMemo(() => spotsToFeatureCollection(spots), [spots]);
  const bounds = useMemo(() => computeBounds(zones, spots), [zones, spots]);

  // Animacion i vogël ("flash") kur një spot ndryshon status live — kërkesë
  // e §4 (CLAUDE.md): harta përditësohet pa refresh me animacion të dukshëm.
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    const map = mapRef.current;

    for (const spot of spots) {
      const previous = prevStatus.get(spot.id);
      if (previous && previous !== spot.status && map) {
        const existingTimeout = flashTimeoutsRef.current.get(spot.id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }
        try {
          map.setFeatureState(
            { source: "spots", id: spot.id },
            { flash: true },
          );
        } catch {
          // burimi mund të mos jetë ende gati; anashkalo në heshtje
        }
        flashTimeoutsRef.current.set(
          spot.id,
          setTimeout(() => {
            try {
              map.setFeatureState(
                { source: "spots", id: spot.id },
                { flash: false },
              );
            } catch {
              // harta mund të jetë shkëputur ndërkohë
            }
            flashTimeoutsRef.current.delete(spot.id);
          }, FLASH_DURATION_MS),
        );
      }
      prevStatus.set(spot.id, spot.status);
    }
  }, [spots]);

  useEffect(() => {
    const timeouts = flashTimeoutsRef.current;
    return () => {
      for (const timeout of timeouts.values()) {
        clearTimeout(timeout);
      }
    };
  }, []);

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
      <MapGL
        ref={mapRef}
        initialViewState={
          bounds
            ? { bounds, fitBoundsOptions: { padding: 48 } }
            : {
                longitude: PRIZREN_CENTER.longitude,
                latitude: PRIZREN_CENTER.latitude,
                zoom: 14,
              }
        }
        mapStyle={BASEMAP_STYLE}
        interactiveLayerIds={["spots-circle"]}
        onClick={handleClick}
      >
        <Source id="zones" type="geojson" data={zonesData}>
          <Layer
            id="zones-fill"
            type="fill"
            paint={{ "fill-color": "#3b82f6", "fill-opacity": 0.2 }}
          />
          <Layer
            id="zones-outline"
            type="line"
            paint={{ "line-color": "#2563eb", "line-width": 2.5 }}
          />
        </Source>

        <Source id="spots" type="geojson" data={spotsData}>
          <Layer
            id="spots-circle"
            type="circle"
            paint={{
              "circle-radius": [
                "case",
                ["boolean", ["feature-state", "flash"], false],
                12,
                7,
              ],
              "circle-radius-transition": { duration: 300, delay: 0 },
              "circle-stroke-width": [
                "case",
                ["boolean", ["feature-state", "flash"], false],
                4,
                2,
              ],
              "circle-stroke-color": "#ffffff",
              "circle-color": [
                "match",
                ["get", "status"],
                "free",
                STATUS_MARKER_COLORS.free,
                "occupied",
                STATUS_MARKER_COLORS.occupied,
                "reserved",
                STATUS_MARKER_COLORS.reserved,
                "disabled",
                STATUS_MARKER_COLORS.disabled,
                STATUS_MARKER_COLORS.free,
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
      </MapGL>
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
              style={{ backgroundColor: STATUS_MARKER_COLORS[status] }}
            />
            <span>{STATUS_LABELS[status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
