import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { LocalReport } from "./db";
import { buildMapView, reportsWithCoordinates } from "./map-points";

const TILE_SIZE = 256;

export function ReportMap({
  reports,
  onOpenReport,
}: {
  reports: LocalReport[];
  onOpenReport: (clientId: string) => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointerId: number;
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);
  const points = reportsWithCoordinates(reports);
  const signature = points
    .map(
      (report) => `${report.clientId}:${report.latitude}:${report.longitude}`,
    )
    .join("|");
  const [size, setSize] = useState({ width: 320, height: 384 });
  const [zoom, setZoom] = useState<number | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setZoom(null);
    setPan({ x: 0, y: 0 });
  }, [signature]);

  useEffect(() => {
    const element = frame.current;
    if (!element || typeof ResizeObserver !== "function") return;
    const read = () => {
      if (element.clientWidth > 0 && element.clientHeight > 0) {
        setSize({
          width: element.clientWidth,
          height: element.clientHeight,
        });
      }
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(element);
    return () => observer.disconnect();
  }, [points.length]);

  if (points.length === 0) {
    return (
      <div
        className="grid h-96 place-items-center rounded-2xl border border-slate-200 bg-slate-100 px-6 text-center text-sm text-slate-600"
        role="region"
        aria-label="Mapa de reportes"
      >
        No hay coordenadas para mostrar en el mapa.
      </div>
    );
  }

  const view = buildMapView(points, size, {
    ...(zoom === null ? {} : { zoom }),
    panX: pan.x,
    panY: pan.y,
  });

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, a")) return;
    drag.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    setPan({
      x: current.panX + event.clientX - current.x,
      y: current.panY + event.clientY - current.y,
    });
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  };

  return (
    <div
      ref={frame}
      className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-200"
      role="region"
      aria-label="Mapa de reportes"
      style={{ height: "24rem", touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {view.tiles.map((tile) => (
        <img
          key={tile.key}
          src={tile.url}
          alt=""
          width={TILE_SIZE}
          height={TILE_SIZE}
          draggable={false}
          style={{
            position: "absolute",
            left: tile.left,
            top: tile.top,
            width: TILE_SIZE,
            height: TILE_SIZE,
            maxWidth: "none",
          }}
        />
      ))}
      {view.markers.map((marker) => (
        <div
          key={marker.clientId}
          className="absolute flex justify-center"
          style={{
            left: marker.left,
            top: marker.top,
            width: 0,
            height: 0,
            alignItems: "flex-end",
          }}
        >
          <button
            type="button"
            className="mb-1 flex flex-col items-center"
            onClick={() => onOpenReport(marker.clientId)}
          >
            <span className="max-w-40 truncate rounded-full bg-blue-700 px-2 py-1 text-xs font-semibold text-white">
              {marker.description}
            </span>
            <span className="mt-1 size-3.5 rounded-full border-2 border-white bg-blue-600 shadow" />
          </button>
        </div>
      ))}
      <div className="absolute top-2 left-2 z-20 overflow-hidden rounded-md border border-slate-300 bg-white shadow">
        <button
          type="button"
          aria-label="Acercar"
          className="block h-8 w-8 border-b border-slate-300 text-lg leading-none font-semibold"
          onClick={() =>
            setZoom((current) => Math.min(18, (current ?? view.zoom) + 1))
          }
        >
          +
        </button>
        <button
          type="button"
          aria-label="Alejar"
          className="block h-8 w-8 text-lg leading-none font-semibold"
          onClick={() =>
            setZoom((current) => Math.max(2, (current ?? view.zoom) - 1))
          }
        >
          −
        </button>
      </div>
      <a
        className="absolute right-2 bottom-2 z-20 rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-slate-600"
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
      >
        © OpenStreetMap
      </a>
    </div>
  );
}
