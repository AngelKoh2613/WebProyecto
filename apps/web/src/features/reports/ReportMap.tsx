import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./report-map.css";
import type { LocalReport } from "./db";
import {
  coordinateCenter,
  REPORT_MAP_TILES,
  reportsWithCoordinates,
} from "./map-points";

export function ReportMap({
  reports,
  onOpenReport,
}: {
  reports: LocalReport[];
  onOpenReport: (clientId: string) => void;
}) {
  const node = useRef<HTMLDivElement>(null);
  const points = reportsWithCoordinates(reports);
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
    let observer: ResizeObserver | undefined;
    let cancelled = false;

    void import("leaflet")
      .then((leaflet) => {
        if (cancelled) return;
        const L = leaflet.default;
        const located = pointsRef.current;
        map = L.map(element, {
          zoomControl: true,
          fadeAnimation: false,
          zoomAnimation: false,
        });

        const only = located[0];
        if (located.length === 1 && only) {
          map.setView([only.latitude, only.longitude], 15);
        } else if (located.length > 1) {
          map.setView(coordinateCenter(located), 12);
        } else {
          map.setView([0, 0], 2);
        }

        const tiles = L.tileLayer(REPORT_MAP_TILES, {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        const markers = located.map((report) => {
          const marker = L.circleMarker([report.latitude, report.longitude], {
            radius: 10,
            color: "#ffffff",
            weight: 3,
            fillColor: "#1d4ed8",
            fillOpacity: 1,
          }).addTo(map as LeafletMap);
          marker.bindTooltip(report.description, {
            permanent: located.length <= 8,
            direction: "top",
            offset: [0, -8],
            opacity: 1,
            className: "report-map-label",
          });
          marker.on("click", () => openRef.current(report.clientId));
          return marker;
        });

        let framed = false;
        const frame = () => {
          if (!map) return;
          map.invalidateSize();
          const size = map.getSize();
          if (framed || size.x === 0 || size.y === 0) return;
          const onlyMarker = markers[0];
          if (markers.length === 1 && onlyMarker) {
            map.setView(onlyMarker.getLatLng(), 15);
          } else if (markers.length > 1) {
            map.fitBounds(
              L.latLngBounds(markers.map((marker) => marker.getLatLng())),
              { padding: [32, 32], maxZoom: 15 },
            );
          }
          framed = markers.length > 0;
        };

        map.whenReady(frame);
        requestAnimationFrame(frame);
        tiles.on("load", () => {
          map?.invalidateSize();
        });
        if (typeof ResizeObserver === "function") {
          observer = new ResizeObserver(() => {
            frame();
          });
          observer.observe(element);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      observer?.disconnect();
      map?.remove();
    };
  }, [signature]);

  return (
    <div
      className="relative z-0 overflow-hidden rounded-2xl border border-slate-200"
      style={{ transform: "translateZ(0)" }}
    >
      <div
        ref={node}
        className="report-map w-full"
        style={{ height: "24rem" }}
        role="region"
        aria-label="Mapa de reportes"
      />
    </div>
  );
}
