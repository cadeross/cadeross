"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { archiveItems, ArchiveItem } from "@/lib/projects";

const itemPositions: { [key: string]: { x: number; y: number; rotate: number } } = {
  // Column 1 (x: -960)
  "study-typography": { x: -960, y: -650, rotate: 0 },
  "solana-docs": { x: -960, y: -250, rotate: 0 },
  "solana-education": { x: -960, y: 20, rotate: 0 },
  "type-specimen": { x: -960, y: 400, rotate: 0 },
  "color-system": { x: -960, y: 850, rotate: 0 },
  // Column 2 (x: -480)
  "wallet-concept": { x: -480, y: -800, rotate: 0 },
  "baylor-platform": { x: -480, y: -400, rotate: 0 },
  "baylor-marketing": { x: -480, y: -130, rotate: 0 },
  "the-prayer-app": { x: -480, y: 260, rotate: 0 },
  "portfolio-v2": { x: -480, y: 650, rotate: 0 },
  // Column 3 (x: 0)
  "openwrit-reading": { x: 0, y: -550, rotate: 0 },
  "openwrit-library": { x: 0, y: -50, rotate: 0 },
  "study-grid": { x: 0, y: 400, rotate: 0 },
  "marketplace": { x: 0, y: 730, rotate: 0 },
  // Column 4 (x: 480)
  "dashboard-study": { x: 480, y: -750, rotate: 0 },
  "notion-calendar": { x: 480, y: -420, rotate: 0 },
  "reader-app": { x: 480, y: 30, rotate: 0 },
  "essay-layout": { x: 480, y: 540, rotate: 0 },
  "first-site": { x: 480, y: 925, rotate: 0 },
  // Column 5 (x: 960)
  "study-motion": { x: 960, y: -680, rotate: 0 },
  "vlyss-site": { x: 960, y: -410, rotate: 0 },
  "vlyss-identity": { x: 960, y: -80, rotate: 0 },
  "icon-set": { x: 960, y: 310, rotate: 0 },
  "portfolio-v1": { x: 960, y: 640, rotate: 0 },
};

const itemAspectRatios: { [key: string]: string } = {
  "openwrit-reading": "3 / 4",
  "openwrit-library": "3 / 4",
  "baylor-platform": "16 / 10",
  "baylor-marketing": "16 / 10",
  "notion-calendar": "1 / 1",
  "solana-education": "16 / 10",
  "solana-docs": "16 / 10",
  "vlyss-identity": "1 / 1",
  "vlyss-site": "16 / 10",
  "the-prayer-app": "3 / 4",
  "study-typography": "3 / 4",
  "study-grid": "1 / 1",
  "study-motion": "16 / 10",
  "wallet-concept": "3 / 4",
  "reader-app": "3 / 4",
  "essay-layout": "3 / 4",
  "marketplace": "16 / 10",
  "dashboard-study": "16 / 10",
  "icon-set": "1 / 1",
  "type-specimen": "3 / 4",
  "color-system": "1 / 1",
  "portfolio-v2": "16 / 10",
  "portfolio-v1": "16 / 10",
  "first-site": "16 / 10",
};

export default function ArchivePage() {
  const [transform, setTransform] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);
  const [isCentering, setIsCentering] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Refs for tracking values inside handlers without triggering renders
  const dragStart = useRef({ x: 0, y: 0 });
  const canvasStart = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const transformRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);

  // Inertia
  const velocity = useRef({ x: 0, y: 0 });
  const lastMousePos = useRef({ x: 0, y: 0 });
  const lastTime = useRef(0);
  const animFrameId = useRef<number | null>(null);

  // Sync state with refs
  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const updateTransform = (x: number, y: number, s: number) => {
    // Infinite panning allows any coordinate, no hard clamping!
    transformRef.current = { x, y };
    scaleRef.current = s;
    
    if (wrapperRef.current) {
      wrapperRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
    }
  };

  const handleStart = (clientX: number, clientY: number) => {
    if (selectedItem) return;

    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }

    setIsDragging(true);
    isDraggingRef.current = true;
    setIsCentering(false);

    dragStart.current = { x: clientX, y: clientY };
    canvasStart.current = { ...transformRef.current };
    lastMousePos.current = { x: clientX, y: clientY };
    lastTime.current = performance.now();
    velocity.current = { x: 0, y: 0 };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;

    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    
    const nextX = canvasStart.current.x + dx;
    const nextY = canvasStart.current.y + dy;

    // Track velocity
    const now = performance.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      const vx = (clientX - lastMousePos.current.x) / dt * 16.666;
      const vy = (clientY - lastMousePos.current.y) / dt * 16.666;
      velocity.current.x = velocity.current.x * 0.7 + vx * 0.3;
      velocity.current.y = velocity.current.y * 0.7 + vy * 0.3;
    }

    lastMousePos.current = { x: clientX, y: clientY };
    lastTime.current = now;

    updateTransform(nextX, nextY, scaleRef.current);
  };

  const handleEnd = () => {
    if (!isDraggingRef.current) return;

    setIsDragging(false);
    isDraggingRef.current = false;
    setTransform(transformRef.current);

    // Inertia decay
    const speed = Math.sqrt(velocity.current.x ** 2 + velocity.current.y ** 2);
    if (speed > 1) {
      const animateInertia = () => {
        velocity.current.x *= 0.94;
        velocity.current.y *= 0.94;

        const nextX = transformRef.current.x + velocity.current.x;
        const nextY = transformRef.current.y + velocity.current.y;

        updateTransform(nextX, nextY, scaleRef.current);

        const currentSpeed = Math.sqrt(velocity.current.x ** 2 + velocity.current.y ** 2);
        if (currentSpeed > 0.15) {
          animFrameId.current = requestAnimationFrame(animateInertia);
        } else {
          setTransform(transformRef.current);
          animFrameId.current = null;
        }
      };
      animFrameId.current = requestAnimationFrame(animateInertia);
    }
  };

  // Figma/Freeform Trackpad and Wheel events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const rect = container.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (e.ctrlKey || e.metaKey) {
        // 1. Zooming centered on mouse pointer (Figma style)
        // Zoom factor determines speed
        const zoomFactor = 0.008;
        const delta = -e.deltaY * zoomFactor;
        
        setScale((prevScale) => {
          const nextScale = Math.max(0.12, Math.min(3.5, prevScale * (1 + delta)));
          
          setTransform((prevTransform) => {
            // Find coordinates under cursor relative to canvas center
            const cx = (mx - rect.width / 2 - prevTransform.x) / prevScale;
            const cy = (my - rect.height / 2 - prevTransform.y) / prevScale;
            
            // Recalculate translation to anchor the cursor point
            const nextX = mx - rect.width / 2 - cx * nextScale;
            const nextY = my - rect.height / 2 - cy * nextScale;
            
            transformRef.current = { x: nextX, y: nextY };
            if (wrapperRef.current) {
              wrapperRef.current.style.transform = `translate3d(${nextX}px, ${nextY}px, 0) scale(${nextScale})`;
            }
            return { x: nextX, y: nextY };
          });

          scaleRef.current = nextScale;
          return nextScale;
        });
      } else {
        // 2. Panning / Scrolling with trackpad two fingers
        setTransform((prev) => {
          const nextX = prev.x - e.deltaX;
          const nextY = prev.y - e.deltaY;
          
          transformRef.current = { x: nextX, y: nextY };
          if (wrapperRef.current) {
            wrapperRef.current.style.transform = `translate3d(${nextX}px, ${nextY}px, 0) scale(${scaleRef.current})`;
          }
          return transformRef.current;
        });
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Button Zoom Handlers
  const handleZoom = (factor: number) => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mx = rect.width / 2;
    const my = rect.height / 2;

    setIsCentering(true);
    
    setScale((prevScale) => {
      const nextScale = Math.max(0.12, Math.min(3.5, prevScale * factor));
      
      setTransform((prevTransform) => {
        const cx = (mx - rect.width / 2 - prevTransform.x) / prevScale;
        const cy = (my - rect.height / 2 - prevTransform.y) / prevScale;
        
        const nextX = mx - rect.width / 2 - cx * nextScale;
        const nextY = my - rect.height / 2 - cy * nextScale;
        
        transformRef.current = { x: nextX, y: nextY };
        if (wrapperRef.current) {
          wrapperRef.current.style.transform = `translate3d(${nextX}px, ${nextY}px, 0) scale(${nextScale})`;
        }
        return { x: nextX, y: nextY };
      });
      
      scaleRef.current = nextScale;
      return nextScale;
    });

    setTimeout(() => {
      setIsCentering(false);
    }, 200);
  };

  const handleCenter = () => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }

    setIsCentering(true);
    updateTransform(0, 0, 1);
    setTransform({ x: 0, y: 0 });
    setScale(1);

    setTimeout(() => {
      setIsCentering(false);
    }, 600);
  };

  // Prevent browser scrolling
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="archive-canvas-container"
        data-dragging={isDragging}
        onMouseDown={(e) => {
          if (e.button !== 0) return; // Left click only
          handleStart(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => {
          if (e.touches.length !== 1) return;
          handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          if (e.touches.length !== 1) return;
          handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={handleEnd}
      >
        {/* Floating HUD header */}
        <div className="archive-hud-header">
          <Link href="/" className="archive-hud-back">
            ← Home
          </Link>
          <span className="archive-hud-title">~/archive</span>
          <span className="archive-hud-badge">{archiveItems.length} items</span>
        </div>

        {/* Translation and Scale canvas wrapper */}
        <div
          ref={wrapperRef}
          className={`archive-canvas-wrapper ${isCentering ? "is-centering" : ""}`}
          style={{
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${scale})`,
          }}
        >
          {/* Infinite dotted background inside canvas to scale naturally with zoom */}
          <div className="archive-canvas-grid" />

          {archiveItems.map((item) => {
            const pos = itemPositions[item.id] || { x: 0, y: 0, rotate: 0 };
            const isActive = activeId === item.id;
            const aspect = itemAspectRatios[item.id] || "16 / 10";

            return (
              <div
                key={item.id}
                className="archive-card archive-card--image"
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: `translate3d(-50%, -50%, 0) scale(${isActive ? 1.04 : 1})`,
                  zIndex: isActive ? 10 : 1,
                }}
                onMouseEnter={() => setActiveId(item.id)}
                onMouseLeave={() => setActiveId(null)}
                onClick={() => setSelectedItem(item)}
              >
                {/* Corner wedge frames */}
                <div className="archive-card-corner top-left" />
                <div className="archive-card-corner top-right" />
                <div className="archive-card-corner bottom-left" />
                <div className="archive-card-corner bottom-right" />

                <div className="archive-image-container" style={{ aspectRatio: aspect }}>
                  <div className="archive-placeholder-shape">
                    <svg className="archive-placeholder-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <line x1="0" y1="0" x2="100" y2="100" stroke="var(--cr-border)" strokeWidth="0.5" />
                      <line x1="100" y1="0" x2="0" y2="100" stroke="var(--cr-border)" strokeWidth="0.5" />
                    </svg>
                    <div className="archive-placeholder-cross" />
                  </div>
                </div>
                <div className="archive-card-meta">
                  <span className="archive-card-title">{item.title}</span>
                  <span className="archive-card-year">{item.year}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating controls HUD with Zoom options */}
        <div className="archive-hud-controls">
          <button className="archive-hud-btn" onClick={() => handleZoom(0.8)}>
            −
          </button>
          <button className="archive-hud-btn" onClick={handleCenter} style={{ minWidth: "50px" }}>
            {Math.round(scale * 100)}%
          </button>
          <button className="archive-hud-btn" onClick={() => handleZoom(1.25)}>
            +
          </button>
        </div>

        {/* Hover instructions HUD */}
        <div className="archive-hud-instructions">
          Scroll/Drag to pan. Pinch/Cmd+Scroll to zoom. Click cards to expand.
        </div>
      </div>

      {/* Expanded view lightbox modal */}
      {selectedItem && (
        <div
          className="archive-lightbox"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="archive-lightbox-content"
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: "0px" }}
          >
            <button
              className="archive-lightbox-close"
              onClick={() => setSelectedItem(null)}
            >
              [close]
            </button>
            
            {/* Corner wedge frames for lightbox */}
            <div className="archive-card-corner top-left" style={{ borderWidth: "2px", width: "16px", height: "16px" }} />
            <div className="archive-card-corner top-right" style={{ borderWidth: "2px", width: "16px", height: "16px" }} />
            <div className="archive-card-corner bottom-left" style={{ borderWidth: "2px", width: "16px", height: "16px" }} />
            <div className="archive-card-corner bottom-right" style={{ borderWidth: "2px", width: "16px", height: "16px" }} />

            <div className="archive-lightbox-image-wrap" style={{ aspectRatio: itemAspectRatios[selectedItem.id] || "16 / 10" }}>
              <div className="archive-placeholder-shape" style={{ height: "100%", position: "relative" }}>
                <svg className="archive-placeholder-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line x1="0" y1="0" x2="100" y2="100" stroke="var(--cr-border)" strokeWidth="0.5" />
                  <line x1="100" y1="0" x2="0" y2="100" stroke="var(--cr-border)" strokeWidth="0.5" />
                </svg>
                <div className="archive-placeholder-cross" style={{ width: "24px", height: "24px" }} />
                
                {/* Tech blueprint lines / text */}
                <div className="absolute inset-4 flex flex-col justify-between pointer-events-none font-mono text-[9px] opacity-40 uppercase tracking-widest">
                  <div className="flex justify-between">
                    <span>CAD // PLOT SCALE 1:1</span>
                    <span>DRG. NO: {selectedItem.id.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DO NOT SCALE FROM DRAWING</span>
                    <span>REF: CADE ROSS ARCHIVE</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="archive-lightbox-footer">
              <span className="archive-lightbox-title">{selectedItem.title}</span>
              <span className="archive-lightbox-year">{selectedItem.year}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
