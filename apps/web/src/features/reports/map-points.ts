import type { LocalReport } from "./db";

export const REPORT_MAP_TILES =
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export type LocatedReport = LocalReport & {
  latitude: number;
  longitude: number;
};

export function reportsWithCoordinates(
  reports: LocalReport[],
): LocatedReport[] {
  return reports.filter(
    (report): report is LocatedReport =>
      typeof report.latitude === "number" &&
      typeof report.longitude === "number" &&
      Number.isFinite(report.latitude) &&
      Number.isFinite(report.longitude) &&
      report.latitude >= -90 &&
      report.latitude <= 90 &&
      report.longitude >= -180 &&
      report.longitude <= 180,
  );
}

export function coordinateCenter(points: LocatedReport[]): [number, number] {
  const latitude =
    points.reduce((sum, point) => sum + point.latitude, 0) / points.length;
  const longitude =
    points.reduce((sum, point) => sum + point.longitude, 0) / points.length;
  return [latitude, longitude];
}

const TILE_SIZE = 256;
const MAX_ZOOM = 16;
const MIN_ZOOM = 2;
const MARKER_PADDING = 48;

export type MapSize = { width: number; height: number };

export type MapTile = {
  key: string;
  url: string;
  left: number;
  top: number;
};

export type MapMarker = {
  clientId: string;
  description: string;
  left: number;
  top: number;
};

export type MapView = {
  zoom: number;
  tiles: MapTile[];
  markers: MapMarker[];
};

function worldPixel(latitude: number, longitude: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const x = ((longitude + 180) / 360) * scale;
  const sine = Math.sin((latitude * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function chooseZoom(points: LocatedReport[], size: MapSize): number {
  const roomWidth = Math.max(size.width - MARKER_PADDING * 2, 32);
  const roomHeight = Math.max(size.height - MARKER_PADDING * 2, 32);
  for (let zoom = MAX_ZOOM; zoom > MIN_ZOOM; zoom -= 1) {
    const pixels = points.map((point) =>
      worldPixel(point.latitude, point.longitude, zoom),
    );
    const xs = pixels.map((pixel) => pixel.x);
    const ys = pixels.map((pixel) => pixel.y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    if (width <= roomWidth && height <= roomHeight) return zoom;
  }
  return MIN_ZOOM;
}

export function buildMapView(
  points: LocatedReport[],
  size: MapSize,
  options?: { zoom?: number; panX?: number; panY?: number },
): MapView {
  if (points.length === 0 || size.width <= 0 || size.height <= 0) {
    return { zoom: MIN_ZOOM, tiles: [], markers: [] };
  }

  const zoom = options?.zoom ?? chooseZoom(points, size);
  const [latitude, longitude] = coordinateCenter(points);
  const center = worldPixel(latitude, longitude, zoom);
  const originX = center.x - size.width / 2 - (options?.panX ?? 0);
  const originY = center.y - size.height / 2 - (options?.panY ?? 0);
  const minTileX = Math.floor(originX / TILE_SIZE);
  const maxTileX = Math.floor((originX + size.width - 1) / TILE_SIZE);
  const minTileY = Math.floor(originY / TILE_SIZE);
  const maxTileY = Math.floor((originY + size.height - 1) / TILE_SIZE);
  const wrap = 2 ** zoom;
  const tiles: MapTile[] = [];

  for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
    for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
      if (tileY < 0 || tileY >= wrap) continue;
      const wrappedX = ((tileX % wrap) + wrap) % wrap;
      tiles.push({
        key: `${zoom}/${tileX}/${tileY}`,
        url: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${tileY}.png`,
        left: tileX * TILE_SIZE - originX,
        top: tileY * TILE_SIZE - originY,
      });
    }
  }

  return {
    zoom,
    tiles,
    markers: points.map((point) => {
      const pixel = worldPixel(point.latitude, point.longitude, zoom);
      return {
        clientId: point.clientId,
        description: point.description,
        left: pixel.x - originX,
        top: pixel.y - originY,
      };
    }),
  };
}
