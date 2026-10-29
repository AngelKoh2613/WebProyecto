export interface ReportIdentity {
  description: string;
  createdAt: string;
  latitude: number | null;
  longitude: number | null;
}

export function sameStoredReport(
  stored: ReportIdentity,
  incoming: ReportIdentity,
): boolean {
  return (
    stored.description === incoming.description &&
    Date.parse(stored.createdAt) === Date.parse(incoming.createdAt) &&
    sameCoordinate(stored.latitude, incoming.latitude) &&
    sameCoordinate(stored.longitude, incoming.longitude)
  );
}

function sameCoordinate(
  stored: number | null,
  incoming: number | null,
): boolean {
  if (stored === null) return true;
  if (incoming === null) return false;
  return Math.abs(stored - incoming) < 0.000001;
}
