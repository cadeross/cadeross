"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { archiveItems, ArchiveItem } from "@/lib/projects";

const itemPositions: { [key: string]: { x: number; y: number; rotate: number } } = {
  "openwrit-reading": { x: -350, y: -250, rotate: -2 },
  "openwrit-library": { x: 100, y: -500, rotate: 3 },
  "baylor-platform": { x: -650, y: -550, rotate: 1 },
  "baylor-marketing": { x: -100, y: -200, rotate: -3 },
  "notion-calendar": { x: 350, y: -300, rotate: -4 },
  "solana-education": { x: -500, y: 150, rotate: 2 },
  "solana-docs": { x: -150, y: 350, rotate: -1 },
  "vlyss-identity": { x: 250, y: 100, rotate: 4 },
  "vlyss-site": { x: 600, y: -100, rotate: -2 },
  "the-prayer-app": { x: -950, y: -200, rotate: 3 },
  "study-typography": { x: -800, y: 100, rotate: -3 },
  "study-grid": { x: -450, y: -900, rotate: 2 },
  "study-motion": { x: 800, y: -500, rotate: 5 },
  "wallet-concept": { x: -950, y: -650, rotate: -4 },
  "reader-app": { x: 750, y: 250, rotate: 3 },
  "essay-layout": { x: 950, y: -350, rotate: -2 },
  "marketplace": { x: -300, y: 700, rotate: 1 },
  "dashboard-study": { x: 150, y: 600, rotate: -3 },
  "icon-set": { x: 500, y: 550, rotate: 2 },
  "type-specimen": { x: -750, y: 500, rotate: -2 },
  "color-system": { x: -1300, y: -100, rotate: 4 },
  "portfolio-v2": { x: -1150, y: -500, rotate: -3 },
  "portfolio-v1": { x: 1100, y: -650, rotate: 1 },
  "first-site": { x: -100, y: -950, rotate: -5 },
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
            const isImage = !!item.src;
            const isActive = activeId === item.id;

            return (
              <div
                key={item.id}
                className={`archive-card ${
                  isImage ? "archive-card--image" : "archive-card--wireframe"
                }`}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: `translate(-50%, -50%) rotate(${isActive ? 0 : pos.rotate}deg)`,
                  zIndex: isActive ? 10 : 1,
                }}
                onMouseEnter={() => setActiveId(item.id)}
                onMouseLeave={() => setActiveId(null)}
                onClick={() => {
                  if (isImage) {
                    setSelectedItem(item);
                  }
                }}
              >
                {isImage ? (
                  <>
                    <div className="archive-image-container">
                      <Image
                        src={item.src!}
                        alt={item.title}
                        fill
                        className="archive-image"
                        sizes="(max-width: 768px) 240px, 320px"
                        priority={item.id === "openwrit-reading"}
                      />
                    </div>
                    <div className="archive-card-meta">
                      <span className="archive-card-title">{item.title}</span>
                      <span className="archive-card-year">{item.year}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="archive-wireframe-bg" />
                    <div className="archive-wireframe-border" />
                    <div className="archive-wireframe-header">
                      <span className="archive-wireframe-tech">Wireframe // CAD</span>
                      <div className="archive-wireframe-crosshair" />
                    </div>
                    <div className="archive-wireframe-body">
                      <div className="archive-wireframe-title">{item.title}</div>
                      <div className="archive-wireframe-year">{item.year}</div>
                    </div>
                  </>
                )}
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
          Scroll/Drag to pan. Pinch/Cmd+Scroll to zoom. Click image cards to expand.
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
          >
            <button
              className="archive-lightbox-close"
              onClick={() => setSelectedItem(null)}
            >
              [close]
            </button>
            <div className="archive-lightbox-image-wrap">
              <Image
                src={selectedItem.src!}
                alt={selectedItem.title}
                width={1200}
                height={750}
                className="archive-lightbox-image"
                priority
              />
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
