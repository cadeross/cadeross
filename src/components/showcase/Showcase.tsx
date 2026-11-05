"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ComponentType, type CSSProperties } from "react";
import type { DemoId, WorkMedia } from "@/lib/portfolio";
import { productFonts } from "./fonts";
import "./showcase.css";

/* The figure language for every project page, after benji.org's essays: one
   plate per figure, the media inside it, a short caption under it and a
   1x / 0.5x switch beside the caption. Videos loop muted; demos are live
   Stageshow scenes (React, not recordings), loaded on the client only. */

type DemoProps = { speed: number };

/* Design size of each demo's wide and phone layouts, so the plate holds its
   height before the scene loads and nothing below it jumps. */
const DEMOS: Record<DemoId, { load: ComponentType<DemoProps>; aspect: string; compact: string }> = {
  "everdeck-review": { load: dynamic(() => import("./demos/everdeck/ReviewDemo"), { ssr: false }), aspect: "720 / 500", compact: "390 / 560" },
  "everdeck-generate": { load: dynamic(() => import("./demos/everdeck/GenerateDemo"), { ssr: false }), aspect: "720 / 520", compact: "390 / 520" },
  "everdeck-import": { load: dynamic(() => import("./demos/everdeck/ImportDemo"), { ssr: false }), aspect: "720 / 600", compact: "390 / 560" },
  "openwrit-highlight": { load: dynamic(() => import("./demos/openwrit/HighlightDemo"), { ssr: false }), aspect: "580 / 420", compact: "390 / 560" },
  "openwrit-chapters": { load: dynamic(() => import("./demos/openwrit/ChaptersDemo"), { ssr: false }), aspect: "580 / 420", compact: "390 / 520" },
  "harbor-servers": { load: dynamic(() => import("./demos/harbor/ServersDemo"), { ssr: false }), aspect: "580 / 470", compact: "390 / 600" },
  "harbor-awake": { load: dynamic(() => import("./demos/harbor/AwakeDemo"), { ssr: false }), aspect: "580 / 300", compact: "390 / 300" },
  "spyglass-record": { load: dynamic(() => import("./demos/spyglass/RecordDemo"), { ssr: false }), aspect: "580 / 470", compact: "390 / 560" },
  "spyglass-review": { load: dynamic(() => import("./demos/spyglass/ReviewDemo"), { ssr: false }), aspect: "580 / 440", compact: "390 / 330" },
};

const SPEEDS = [1, 0.5] as const;

function SpeedToggle({ speed, onChange }: { speed: number; onChange: (s: number) => void }) {
  const next = speed === 1 ? 0.5 : 1;
  return (
    <button
      type="button"
      className="sc-speed"
      onClick={() => onChange(next)}
      aria-label={`Playback speed ${speed}x. Switch to ${next}x`}
    >
      {SPEEDS.map((s) => (
        <span key={s} data-active={s === speed}>
          {s}x
        </span>
      ))}
    </button>
  );
}

function LoopVideo({ src, poster, alt, speed }: { src: string; poster?: string; alt: string; speed: number }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.playbackRate = speed;
  }, [speed]);

  /* Play only while on screen, and not at all under reduced motion (the
     poster stands in, with controls to play it by hand). */
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.controls = true;
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.25 },
    );
    io.observe(video);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className="sc-video"
      src={src}
      poster={poster}
      aria-label={alt}
      muted
      loop
      playsInline
      preload="metadata"
    />
  );
}

export default function Showcase({ media, className }: { media: WorkMedia; className?: string }) {
  const [speed, setSpeed] = useState(1);

  const isPlaceholder = media.type !== "demo" && !media.src;
  const moves = media.type === "demo" || (media.type === "video" && !!media.src);

  let body: React.ReactNode;
  if (media.type === "demo") {
    const { load: Demo, aspect, compact } = DEMOS[media.demo];
    body = (
      <div className="sc-stage" style={{ "--sc-aspect": aspect, "--sc-aspect-compact": compact } as CSSProperties} role="img" aria-label={media.alt}>
        <Demo speed={speed} />
      </div>
    );
  } else if (isPlaceholder) {
    body = (
      <div className="sc-placeholder" role="img" aria-label={`Placeholder: ${media.alt}`}>
        <span>
          [{media.type === "video" ? "Video" : "Image"}: {media.alt}]
        </span>
      </div>
    );
  } else if (media.type === "video") {
    body = <LoopVideo src={media.src!} poster={media.poster} alt={media.alt} speed={speed} />;
  } else {
    // eslint-disable-next-line @next/next/no-img-element
    body = <img className="sc-image" src={media.src} alt={media.alt} width={media.width} height={media.height} />;
  }

  return (
    <figure className={`sc-figure ${productFonts}${className ? ` ${className}` : ""}`} data-reveal="fade" data-kind={media.type}>
      <div className="sc-plate" data-placeholder={isPlaceholder || undefined}>
        {body}
      </div>
      {(media.caption || moves) && (
        <figcaption className="sc-caption">
          <span>{media.caption}</span>
          {moves && <SpeedToggle speed={speed} onChange={setSpeed} />}
        </figcaption>
      )}
    </figure>
  );
}
