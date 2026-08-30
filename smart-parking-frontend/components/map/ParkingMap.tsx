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
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { Spot, SpotStatus, Zone } from "@/lib/types";
import { BASEMAP_STYLE } from "@/lib/map-style";
import {
  STATUS_LABELS,
  STATUS_MARKER_COLORS,
  STATUS_MARKER_LETTERS,
} from "@/lib/status-colors";
import { cn } from "@/lib/utils";

const PRIZREN_CENTER = { longitude: 20.7397, latitude: 42.2139 };
const FLASH_DURATION_MS = 1200;

interface ParkingMapProps {
  zones: Zone[];
  spots: Spot[];
  height?: string;
  /** Ndryshimi i kësaj vlere (p.sh. zoneId i filtrit) e bën hartën të rifitojë
   * bounds-in te zonat/spotet aktuale — pa reaguar te çdo update i vogël live. */
  fitKey?: string;
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
): FeatureCollection<
  Point,
  { id: string; code: string; status: SpotStatus; statusLetter: string }
> {
  return {
    type: "FeatureCollection",
    features: spots.map((spot) => ({
      type: "Feature",
      id: spot.id,
      geometry: spot.location,
      properties: {
        id: spot.id,
        code: spot.code,
        status: spot.status,
        statusLetter: STATUS_MARKER_LETTERS[spot.status],
      },
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
  fitKey,
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
  const boundsRef = useRef(bounds);
  useEffect(() => {
    boundsRef.current = bounds;
  }, [bounds]);

  // Rifit i hartës kur ndryshon filtri (fitKey) — jo në çdo update live të
  // spoteve (initialViewState mbulon vetëm montimin e parë).
  const isFirstFitRef = useRef(true);
  useEffect(() => {
    if (isFirstFitRef.current) {
      isFirstFitRef.current = false;
      return;
    }
    const map = mapRef.current;
    if (map && boundsRef.current) {
      map.fitBounds(boundsRef.current, { padding: 48, duration: 800 });
    }
  }, [fitKey]);

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
    const layerId = feature?.layer?.id;
    if (!feature || (layerId !== "spots-circle" && layerId !== "spots-halo")) {
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
        interactiveLayerIds={["spots-circle", "spots-halo"]}
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
          {/* Hale e zbutur poshtë rrethit kryesor — jep thellësi pa u mbështetur
              te box-shadow (MapLibre s'e mbështet mbi canvas). */}
          <Layer
            id="spots-halo"
            type="circle"
            paint={{
              "circle-radius": [
                "case",
                ["boolean", ["feature-state", "flash"], false],
                20,
                13,
              ],
              "circle-radius-transition": { duration: 300, delay: 0 },
              "circle-opacity": 0.18,
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
          {/* Shkronjë brenda çdo marker-i (L/Z/R/J) — jo vetëm ngjyra dallon
              statusin (WCAG 1.4.1), e dukshme në çdo nivel zoom-i. */}
          <Layer
            id="spots-status-letter"
            type="symbol"
            layout={{
              "text-field": ["get", "statusLetter"],
              "text-size": 9,
              "text-font": ["Noto Sans Regular"],
              "text-allow-overlap": true,
              "text-ignore-placement": true,
            }}
            paint={{
              "text-color": "#ffffff",
              "text-halo-width": 0,
            }}
          />
          <Layer
            id="spots-label"
            type="symbol"
            minzoom={16}
            layout={{
              "text-field": ["get", "code"],
              "text-size": 10,
              "text-offset": [0, 1.4],
              "text-anchor": "top",
              "text-font": ["Noto Sans Regular"],
            }}
            paint={{
              "text-color": "#1f2937",
              "text-halo-color": "#ffffff",
              "text-halo-width": 1.2,
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
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", duration: 0.25, bounce: 0.35 }}
              className="flex items-center gap-2 py-0.5 text-sm"
            >
              <span
                aria-hidden="true"
                className="flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{
                  backgroundColor: STATUS_MARKER_COLORS[selectedSpot.status],
                }}
              >
                {STATUS_MARKER_LETTERS[selectedSpot.status]}
              </span>
              <div>
                <p className="font-semibold">{selectedSpot.code}</p>
                <p className="text-xs text-muted-foreground">
                  {STATUS_LABELS[selectedSpot.status]}
                </p>
              </div>
            </motion.div>
          </Popup>
        )}
      </MapGL>
      <StatusLegend />
    </div>
  );
}

function StatusLegend() {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="pointer-events-none absolute top-3 right-3 z-10">
      <div className="pointer-events-auto overflow-hidden rounded-xl border bg-card/95 text-xs shadow-md backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="parking-map-legend-list"
          className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          Legjenda
          <ChevronDown
            className={cn(
              "size-3.5 text-muted-foreground transition-transform",
              expanded && "rotate-180",
            )}
          />
        </button>
        {expanded && (
          <div
            id="parking-map-legend-list"
            className="flex flex-col gap-2 px-3 pb-2.5"
          >
            {(Object.keys(STATUS_LABELS) as SpotStatus[]).map((status) => (
              <div key={status} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="flex size-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ backgroundColor: STATUS_MARKER_COLORS[status] }}
                >
                  {STATUS_MARKER_LETTERS[status]}
                </span>
                <span>{STATUS_LABELS[status]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
