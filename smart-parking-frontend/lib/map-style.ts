import type { StyleSpecification } from "maplibre-gl";

// Tiles OSM publike (pa API key) — të mjaftueshme për demo/portofol. Për
// trafik prodhimi real duhet provider i dedikuar (MapTiler, self-hosted tiles)
// sipas politikës së përdorimit të OSM:
// https://operations.osmfoundation.org/policies/tiles/
export const BASEMAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};
