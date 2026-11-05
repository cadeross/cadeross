"use client";

import { BatteryFull, ChevronsUpDown, Copy, Mic, Monitor, Settings, SquareDashed, AppWindow, Telescope, Video, Volume2, Wifi } from "lucide-react";
import { Bar, Count } from "@/stageshow/kit";

// Spyglass's panel and the desktop it records, from PanelView,
// CaptureControls and RecordingRow: a 360pt panel, a glass segmented row of
// modes (46pt) and scopes (30pt), the device card, the red Start Recording
// button with its shortcut, then Recent.

export const clock = (s: number) => `0:${String(s).padStart(2, "0")}`;

export function SpyMenuBar({ open, recording, elapsed }: { open?: boolean; recording?: boolean; elapsed: number }) {
  return (
    <div className="mac-menubar">
      <span className="mac-menubar__app">Safari</span>
      <span className="mac-menubar__menu mac-wide">File</span>
      <span className="mac-menubar__menu mac-wide">Edit</span>
      <span className="mac-menubar__menu mac-wide">View</span>
      <span className="mac-menubar__right">
        <span className="mac-menubar__item sg-menubar" data-target="menubar-icon" data-open={open} data-recording={recording || undefined}>
          <span className="sg-menubar__idle">
            <Telescope size={15} strokeWidth={2} aria-hidden />
          </span>
          <span className="sg-menubar__live">
            <span className="sg-menubar__dot" />
            <Count value={elapsed} format={clock} />
          </span>
        </span>
        <Wifi size={15} strokeWidth={2.25} aria-hidden />
        <BatteryFull size={19} strokeWidth={1.75} aria-hidden />
        <span className="mac-menubar__time mac-wide">Fri Oct 31 9:41</span>
      </span>
    </div>
  );
}

export function RecordedPage() {
  // The page being recorded: OpenWrit, in Safari.
  return (
    <div className="sg-page">
      <div className="sg-page__title">Genesis 1</div>
      <div className="sg-page__ed">New Revised Standard Version Catholic Edition</div>
      {[96, 100, 92, 98, 70].map((w, i) => (
        <Bar key={i} w={`${w}%`} h={6} tone={2} style={{ marginBottom: 12 }} />
      ))}
      <div style={{ height: 6 }} />
      {[100, 94, 97, 60].map((w, i) => (
        <Bar key={i} w={`${w}%`} h={6} tone={2} style={{ marginBottom: 12 }} />
      ))}
    </div>
  );
}

function Seg({ icon, label, on }: { icon: React.ReactNode; label: string; on?: boolean }) {
  return (
    <span className="sg-seg" data-on={on || undefined}>
      {icon}
      <span>{label}</span>
    </span>
  );
}

function Scope({ icon, label, on }: { icon: React.ReactNode; label: string; on?: boolean }) {
  return (
    <span className="sg-scope" data-on={on || undefined}>
      {icon}
      {label}
    </span>
  );
}

function Device({ icon, title, sub, end }: { icon: React.ReactNode; title: string; sub: string; end: React.ReactNode }) {
  return (
    <div className="sg-device">
      <span className="sg-device__icon">{icon}</span>
      <div className="sg-device__text">
        <div className="mac-row__title">{title}</div>
        <div className="mac-row__sub">{sub}</div>
      </div>
      {end}
    </div>
  );
}

export function SpyPanel({ open }: { open: boolean }) {
  return (
    <div className="sg-panel mac-panel" data-open={open}>
      <div className="mac-header">
        <div className="mac-header__text">
          <div className="mac-title">Spyglass</div>
          <div className="mac-subtitle">Eyes on the horizon</div>
        </div>
        <span className="mac-glass-btn mac-circle">
          <Settings size={14} strokeWidth={2.25} aria-hidden />
        </span>
      </div>
      <div className="sg-body">
        <div className="sg-segs">
          <Seg icon={<Monitor size={15} strokeWidth={2.25} />} label="Screen + Cam" on />
          <Seg icon={<Monitor size={15} strokeWidth={2.25} />} label="Screen" />
          <Seg icon={<Video size={15} strokeWidth={2.25} />} label="Cam" />
        </div>
        <div className="sg-scopes">
          <Scope icon={<Copy size={12} strokeWidth={2.25} />} label="Full Screen" on />
          <Scope icon={<AppWindow size={12} strokeWidth={2.25} />} label="Window" />
          <Scope icon={<SquareDashed size={12} strokeWidth={2.25} />} label="Area" />
        </div>
        <div className="sg-devices mac-row">
          <Device icon={<Video size={13} strokeWidth={2.5} />} title="Camera" sub="FaceTime HD Camera" end={<ChevronsUpDown className="sg-device__chev" size={13} strokeWidth={2} />} />
          <Device icon={<Mic size={13} strokeWidth={2.5} />} title="Microphone" sub="MacBook Pro Microphone" end={<ChevronsUpDown className="sg-device__chev" size={13} strokeWidth={2} />} />
          <Device icon={<Volume2 size={13} strokeWidth={2.5} />} title="System audio" sub="Sound from your Mac is recorded" end={<span className="mac-switch sg-switch" data-on="true" />} />
        </div>
        <div className="sg-start" data-target="start" data-cursor="pointer">
          <span className="sg-start__ring" />
          Start Recording
          <span className="sg-start__keys mac-rounded">⇧⌘L</span>
        </div>
        <div className="sg-recent">
          <span>Recent</span>
          <span className="sg-recent__open">Open Folder</span>
        </div>
        <div className="sg-row mac-row">
          <span className="sg-thumb">
            <span className="sg-thumb__time mac-rounded">5:08</span>
          </span>
          <div className="sg-row__text">
            <div className="sg-row__name">Onboarding walkthrough</div>
            <div className="mac-row__sub">37 min. ago</div>
          </div>
          <span className="mac-glass-btn mac-circle--sm">
            <Copy size={12} strokeWidth={2.25} aria-hidden />
          </span>
        </div>
      </div>
    </div>
  );
}

