"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import { archiveImages, type ArchiveImage } from "@/lib/projects";

/* World coordinate space — items live in a centered Cartesian plane.
   The canvas pans freely; "infinite" is the feel even though the works
   themselves are sparse. */
const WORLD_SIZE = 6800;

type Node = ArchiveImage & {
  wx: number;
  wy: number;
  driftDelay: string;
  driftDuration: string;
};

function buildNodes(images: ArchiveImage[]): Node[] {
  return images.map((img, i) => ({
    ...img,
    wx: (img.x - 0.5) * WORLD_SIZE,
    wy: (img.y - 0.5) * WORLD_SIZE,
    driftDelay: `${(i * 1.7) % 9}s`,
    driftDuration: `${22 + ((i * 5) % 11)}s`,
  }));
}

/* Faint reference markers scattered across the world to give the canvas
   depth as the user pans — these are non-interactive sparkles. */
type Marker = { wx: number; wy: number; size: number };
function buildMarkers(): Marker[] {
  const seed = 0xA110;
  let s = seed;
  const r = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const out: Marker[] = [];
  for (let i = 0; i < 220; i++) {
    out.push({
      wx: (r() - 0.5) * WORLD_SIZE * 1.2,
      wy: (r() - 0.5) * WORLD_SIZE * 1.2,
      size: 3 + r() * 6,
    });
  }
  return out;
}

const DRAG_THRESHOLD = 4; // px

export default function ArchivePage() {
  const nodes = useMemo(() => buildNodes(archiveImages), []);
  const markers = useMemo(() => buildMarkers(), []);

  const surfaceRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  /* Pointer drag state — kept in a ref so listeners always see fresh values. */
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    panStartX: 0,
    panStartY: 0,
    pointerId: -1,
  });
  const [isDragging, setIsDragging] = useState(false);

  const onSurfacePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      // Ignore right-clicks and middle-clicks.
      if (e.button !== 0) return;
      const d = dragRef.current;
      d.active = true;
      d.moved = false;
      d.startX = e.clientX;
      d.startY = e.clientY;
      d.panStartX = pan.x;
      d.panStartY = pan.y;
      d.pointerId = e.pointerId;
      surfaceRef.current?.setPointerCapture(e.pointerId);
      setIsDragging(true);
      if (!hasInteracted) setHasInteracted(true);
    },
    [pan.x, pan.y, hasInteracted]
  );

  const onSurfacePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (!d.active) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        d.moved = true;
      }
      if (d.moved) {
        setPan({ x: d.panStartX + dx, y: d.panStartY + dy });
      }
    },
    []
  );

  const endDrag = useCallback(() => {
    const d = dragRef.current;
    if (!d.active) return;
    d.active = false;
    if (d.pointerId !== -1) {
      try {
        surfaceRef.current?.releasePointerCapture(d.pointerId);
      } catch {
        // pointer already released
      }
    }
    setIsDragging(false);
  }, []);

  /* Wheel/trackpad pans the canvas. */
  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      // Treat as pan; reverse sign so trackpad gestures feel natural.
      e.preventDefault();
      setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      if (!hasInteracted) setHasInteracted(true);
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [hasInteracted]);

  /* Recenter on key 'h'. */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (openIndex !== null) return;
      if (e.key === "h" || e.key === "H") setPan({ x: 0, y: 0 });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex]);

  /* Lightbox keyboard nav. */
  const close = useCallback(() => setOpenIndex(null), []);
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % nodes.length)),
    [nodes.length]
  );
  const prev = useCallback(
    () =>
      setOpenIndex((i) =>
        i === null ? null : (i - 1 + nodes.length) % nodes.length
      ),
    [nodes.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, close, next, prev]);

  function handleNodeClick(i: number) {
    if (dragRef.current.moved) return;
    setOpenIndex(i);
  }

  /* Compass arrow back to origin. */
  const dist = Math.hypot(pan.x, pan.y);
  const compassAngle =
    dist > 1
      ? // Arrow points from current position TOWARD origin.
        (Math.atan2(-pan.y, -pan.x) * 180) / Math.PI + 90
      : 0;
  const compassVisible = dist > 80;

  /* Coordinate readout — gives the canvas a techy vibe. */
  const coords = `${Math.round(-pan.x).toString().padStart(5, " ")}, ${Math.round(-pan.y).toString().padStart(5, " ")}`;

  return (
    <div className="archive-page">
      <header className="archive-header">
        <Link href="/" className="archive-back">
          ← Home
        </Link>
        <p className="archive-label">Archive</p>
      </header>

      <div
        ref={surfaceRef}
        className="archive-surface"
        data-dragging={isDragging ? "true" : "false"}
        onPointerDown={onSurfacePointerDown}
        onPointerMove={onSurfacePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        aria-label="An infinite canvas of work. Drag to pan."
      >
        <div
          className="archive-world"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0)`,
          }}
        >
          {/* Faint background marker dots that move with the world. */}
          <div className="archive-markers" aria-hidden="true">
            {markers.map((m, i) => (
              <span
                key={i}
                className="archive-marker"
                style={{
                  left: `calc(50% + ${m.wx}px)`,
                  top: `calc(50% + ${m.wy}px)`,
                  width: `${m.size}px`,
                  height: `${m.size}px`,
                }}
              />
            ))}
          </div>

          {/* Origin crosshair. */}
          <span className="archive-origin" aria-hidden="true" />

          {/* Work nodes. */}
          {nodes.map((node, i) => {
            const style: CSSProperties & Record<string, string> = {
              left: `calc(50% + ${node.wx}px)`,
              top: `calc(50% + ${node.wy}px)`,
              "--drift-delay": node.driftDelay,
              "--drift-duration": node.driftDuration,
            };
            const isDimmed = hoveredId !== null && hoveredId !== node.id;
            return (
              <button
                key={node.id}
                type="button"
                className="archive-node"
                data-dimmed={isDimmed ? "true" : "false"}
                style={style}
                onPointerEnter={() => setHoveredId(node.id)}
                onPointerLeave={() =>
                  setHoveredId((curr) => (curr === node.id ? null : curr))
                }
                onClick={() => handleNodeClick(i)}
                aria-label={`Open ${node.title}`}
              >
                <span
                  className="archive-node-img"
                  style={{ backgroundImage: `url(${node.src})` }}
                />
                <span className="archive-node-meta">
                  <span className="archive-node-title">{node.title}</span>
                  <span className="archive-node-year">{node.year}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Hint — fades when the user starts panning. */}
        <p
          className="archive-hint"
          data-hidden={hasInteracted ? "true" : "false"}
        >
          Drag to pan · click a node · press H to recenter
        </p>

        {/* Coordinate readout, bottom-left. */}
        <p className="archive-coords" aria-hidden="true">
          [ {coords} ]
        </p>

        {/* Compass back to origin, bottom-right. */}
        <button
          type="button"
          className="archive-compass"
          data-visible={compassVisible ? "true" : "false"}
          onClick={() => setPan({ x: 0, y: 0 })}
          aria-label="Recenter"
          tabIndex={compassVisible ? 0 : -1}
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            <circle
              cx="12"
              cy="12"
              r="10.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
            <path
              d="M12 4 L15 13 L12 11 L9 13 Z"
              fill="currentColor"
              transform={`rotate(${compassAngle} 12 12)`}
            />
          </svg>
        </button>
      </div>

      {openIndex !== null && (
        <div
          className="archive-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={nodes[openIndex].title}
          onClick={close}
        >
          <button
            type="button"
            className="archive-lightbox-nav archive-lightbox-prev"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous"
          >
            ←
          </button>
          <figure
            className="archive-lightbox-figure"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={nodes[openIndex].src}
              alt={nodes[openIndex].title}
              width={nodes[openIndex].width}
              height={nodes[openIndex].height}
              className="archive-lightbox-img"
            />
            <figcaption className="archive-lightbox-caption">
              <span>{nodes[openIndex].title}</span>
              <span>{nodes[openIndex].year}</span>
            </figcaption>
          </figure>
          <button
            type="button"
            className="archive-lightbox-nav archive-lightbox-next"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Next"
          >
            →
          </button>
          <button
            type="button"
            className="archive-lightbox-close"
            onClick={close}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
