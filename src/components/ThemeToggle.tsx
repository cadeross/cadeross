"use client";

import React from "react";
import { useTheme, type Theme } from "./ThemeContext";

const THEME_META: Record<Theme, { icon: string; label: string }> = {
    minimal: { icon: "◻", label: "Minimal" },
    classic: { icon: "♠", label: "Classic" },
    western: { icon: "★", label: "Western" },
    medieval: { icon: "⚔", label: "Medieval" },
};

export default function ThemeToggle() {
    const { theme, cycleTheme } = useTheme();
    const meta = THEME_META[theme];

    return (
        <button
            onClick={cycleTheme}
            className="theme-toggle"
            aria-label={`Current theme: ${meta.label}. Click to switch theme.`}
        >
            <span className="theme-toggle-icon">{meta.icon}</span>
            <span className="theme-toggle-label">{meta.label}</span>
        </button>
    );
}
