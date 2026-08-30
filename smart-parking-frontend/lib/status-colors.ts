import type { SpotStatus } from "@/lib/types";

// Burimi i vetëm i së vërtetës për etiketat + ngjyrat e statuseve të spoteve
// (Faza 14.1) — përdorur nga harta (marker), legend-i, listat dhe panelet.

export const STATUS_LABELS: Record<SpotStatus, string> = {
  free: "I lirë",
  occupied: "I zënë",
  reserved: "I rezervuar",
  disabled: "Jashtë funksionit",
};

// Ngjyra fikse (jo tema-varur) — MapLibre paint expressions marrin vlera
// literale, jo CSS custom properties, dhe harta bazë (OSM raster) mbetet
// gjithmonë "e ditës" pavarësisht temës së aplikacionit.
export const STATUS_MARKER_COLORS: Record<SpotStatus, string> = {
  free: "#059669",
  occupied: "#e11d48",
  reserved: "#d97706",
  disabled: "#64748b",
};

// Klasat Tailwind për badge (bg-tint + text), lexojnë tokens e temës nga
// globals.css (--color-status-*) — përshtaten automatikisht light/dark.
export const STATUS_BADGE_CLASSES: Record<SpotStatus, string> = {
  free: "bg-status-free-bg text-status-free-fg",
  occupied: "bg-status-occupied-bg text-status-occupied-fg",
  reserved: "bg-status-reserved-bg text-status-reserved-fg",
  disabled: "bg-status-disabled-bg text-status-disabled-fg",
};
