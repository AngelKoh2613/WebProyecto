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
