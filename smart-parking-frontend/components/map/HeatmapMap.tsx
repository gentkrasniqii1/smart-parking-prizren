"use client";

import { useCallback, useMemo } from "react";
import { Map as MapGL, Source, Layer } from "react-map-gl/maplibre";
import type { FeatureCollection, Point } from "geojson";
import type { LngLatBoundsLike, Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { HeatmapResponse } from "@/lib/types";
import { BASEMAP_STYLE } from "@/lib/map-style";

const PRIZREN_CENTER = { longitude: 20.7397, latitude: 42.2139 };

interface HeatmapMapProps {
  data: HeatmapResponse;
  height?: string;
}

function toFeatureCollection(
  data: HeatmapResponse,
): FeatureCollection<Point, { spotId: string; code: string; weight: number }> {
  return {
    type: "FeatureCollection",
    features: data.features.map((feature) => ({
      type: "Feature",
      geometry: feature.geometry,
      properties: {
        spotId: feature.properties.spotId,
        code: feature.properties.code,
        weight: feature.properties.weight,
      },
    })),
  };
}

function computeBounds(data: HeatmapResponse): LngLatBoundsLike | null {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const feature of data.features) {
    const [lng, lat] = feature.geometry.coordinates;
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }

  if (!Number.isFinite(minLng)) {
    return null;
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

export function HeatmapMap({ data, height = "360px" }: HeatmapMapProps) {
  const featureCollection = useMemo(() => toFeatureCollection(data), [data]);
  const bounds = useMemo(() => computeBounds(data), [data]);
  // Normalizon peshën në [0,1] për "heatmap-weight" — pa këtë, spotet me
  // aktivitet të lartë absolut do ta ngopnin renderimin krahasuar me pjesën
  // tjetër të hartës, pavarësisht dritares kohore (`days`) të zgjedhur.
  const maxWeight = useMemo(
    () =>
      Math.max(1, ...data.features.map((feature) => feature.properties.weight)),
    [data],
  );

  // Rrjetë sigurie për `initialViewState={{bounds}}` (lexohet vetëm një herë,
  // në montim): nëse harta ngarkohet pasi kontejneri ka marrë përmasat e veta,
  // rifitohen bounds-et në mënyrë eksplicite. Përdor instancën nga vetë eventi
  // (`e.target`), jo një `ref`, që të mos varet nga radha e caktimit të ref-it.
  // SHËNIM: te browser-i i sandbox-uar i testimit ky event `load` NUK arrin
  // kurrë të lëshohet (kufizim i dokumentuar te §8 Faza 2) — prandaj ky rrugë
  // s'u dot verifikua këtu; në browser real ajo është thjesht mbrojtje shtesë
  // mbi sjelljen ekzistuese, jo zëvendësim i saj.
  const handleLoad = useCallback(
    (event: { target: MapLibreMap }) => {
      if (bounds) {
        event.target.fitBounds(bounds, { padding: 48, duration: 0 });
      }
    },
    [bounds],
  );

  return (
    <div
      style={{ height, width: "100%" }}
      className="relative overflow-hidden rounded-lg border"
    >
      <MapGL
        onLoad={handleLoad}
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
      >
        <Source id="heatmap-points" type="geojson" data={featureCollection}>
          <Layer
            id="spots-heat"
            type="heatmap"
            paint={{
              "heatmap-weight": ["/", ["get", "weight"], maxWeight],
              "heatmap-intensity": 1,
              "heatmap-radius": 28,
              "heatmap-opacity": 0.85,
              "heatmap-color": [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                0,
                "rgba(59,130,246,0)",
                0.3,
                "rgba(59,130,246,0.6)",
                0.6,
                "rgba(245,158,11,0.8)",
                1,
                "rgba(239,68,68,0.9)",
              ],
            }}
          />
        </Source>
      </MapGL>
    </div>
  );
}
