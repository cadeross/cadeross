"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Theme = "minimal" | "classic" | "western" | "medieval";

const THEMES: Theme[] = ["minimal", "classic", "western", "medieval"];

interface ThemeContextValue {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: "classic",
    setTheme: () => { },
    cycleTheme: () => { },
});

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("classic");
    const [mounted, setMounted] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("theme") as Theme | null;
        if (stored && THEMES.includes(stored)) {
            setThemeState(stored);
        }
        setMounted(true);
    }, []);

    // Apply data-theme attribute whenever theme changes
    useEffect(() => {
        if (mounted) {
            document.documentElement.setAttribute("data-theme", theme);
            localStorage.setItem("theme", theme);
        }
    }, [theme, mounted]);

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
    }, []);

    const cycleTheme = useCallback(() => {
        setThemeState((prev) => {
            const idx = THEMES.indexOf(prev);
            return THEMES[(idx + 1) % THEMES.length];
        });
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
