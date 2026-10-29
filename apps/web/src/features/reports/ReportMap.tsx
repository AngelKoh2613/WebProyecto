import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LocalReport } from "./db";

export function ReportMap({
  reports,
  onOpenReport,
}: {
  reports: LocalReport[];
  onOpenReport: (clientId: string) => void;
}) {
  const node = useRef<HTMLDivElement>(null);
  const points = reports.filter(
    (report): report is LocalReport & { latitude: number; longitude: number } =>
      report.latitude !== null && report.longitude !== null,
  );
  const signature = points
    .map(
      (report) => `${report.clientId}:${report.latitude}:${report.longitude}`,
    )
    .join("|");

  const pointsRef = useRef(points);
  const openRef = useRef(onOpenReport);
  pointsRef.current = points;
  openRef.current = onOpenReport;

  useEffect(() => {
    const element = node.current;
    if (!element) return;
    let map: LeafletMap | undefined;
    let cancelled = false;
    const currentPoints = pointsRef.current;

    void import("leaflet")
      .then((leaflet) => {
        if (cancelled) return;
        const L = leaflet.default;
        map = L.map(element);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        const markers = currentPoints.map((report) => {
          const marker = L.circleMarker([report.latitude, report.longitude], {
            radius: 8,
            color: "#1d4ed8",
            weight: 2,
            fillColor: "#2563eb",
            fillOpacity: 0.9,
          }).addTo(map as LeafletMap);
          marker.on("click", () => openRef.current(report.clientId));
          return marker;
        });

        if (markers.length > 0) {
          const bounds = L.latLngBounds(
            markers.map((marker) => marker.getLatLng()),
          );
          map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
        } else {
          map.setView([0, 0], 2);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [signature]);

  return (
    <div
      ref={node}
      className="h-96 w-full overflow-hidden rounded-2xl border border-slate-200"
      role="region"
      aria-label="Mapa de reportes"
    />
  );
}
