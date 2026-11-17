import type { StyleSpecification } from "maplibre-gl";

/**
 * Estilos de mapa gratuitos e sem token.
 * Substituem os estilos `mapbox://` apos a revogacao do token herdado do Lovable.
 * Base de dados: OpenStreetMap (mesma fonte que o Mapbox usa no Brasil).
 */

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/** Tema escuro padrao do app (substitui mapbox://styles/mapbox/dark-v11). */
export const MAP_STYLE_DARK =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/** Tema claro (substitui mapbox://styles/mapbox/light-v11). */
export const MAP_STYLE_LIGHT =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

/** Imagem de satelite via ESRI World Imagery (substitui mapbox://styles/mapbox/satellite-v9). */
export const MAP_STYLE_SATELLITE: StyleSpecification = {
  version: 8,
  sources: {
    "esri-satellite": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "&copy; Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [
    {
      id: "esri-satellite",
      type: "raster",
      source: "esri-satellite",
    },
  ],
};

/** Fonte de elevacao gratuita (substitui mapbox://mapbox.mapbox-terrain-dem-v1). */
export const TERRAIN_SOURCE_ID = "terrain-dem";

export const TERRAIN_SOURCE = {
  type: "raster-dem" as const,
  tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
  tileSize: 256,
  maxzoom: 15,
  encoding: "terrarium" as const,
  attribution: OSM_ATTRIBUTION,
};

/** Resolve o estilo a partir do modo usado pelos componentes de mapa. */
export function resolveMapStyle(
  mode: "dark" | "satellite" | "light",
): string | StyleSpecification {
  if (mode === "satellite") return MAP_STYLE_SATELLITE;
  if (mode === "light") return MAP_STYLE_LIGHT;
  return MAP_STYLE_DARK;
}