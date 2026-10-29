export interface ReportIdentity {
  description: string;
  technicianLabel: string | null;
  createdAt: string;
}

export function sameStoredReport(
  stored: ReportIdentity,
  incoming: ReportIdentity,
): boolean {
  return (
    stored.description === incoming.description &&
    stored.technicianLabel === incoming.technicianLabel &&
    Date.parse(stored.createdAt) === Date.parse(incoming.createdAt)
  );
}
