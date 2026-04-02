"use client";

import React, { useState, useRef } from "react";
import Card from "./Card";
import ThemeToggle from "./ThemeToggle";

interface DeckProps {
    cards: {
        id: string;
        initialTop: string;
        initialLeft: string;
        initialRotation: number;
        front: React.ReactNode;
        back: React.ReactNode;
    }[];
}

export default function Deck({ cards }: DeckProps) {
    const [activeExpandedId, setActiveExpandedId] = useState<string | null>(null);

    // Store the global highest Z index in a ref so all cards can increment without forcing a re-render of the entire deck immediately
    const highestZRef = useRef(100);

    const handleBringToFront = () => {
        highestZRef.current += 1;
        return highestZRef.current;
    };

    const handleExpand = (id: string) => {
        setActiveExpandedId(id);
    };

    const handleClose = () => {
        setActiveExpandedId(null);
    };

    return (
        <>
            {/* Background Title Text */}
            <div className="fixed top-6 left-6 z-0 pointer-events-none opacity-50">
                <h1 className="font-display text-4xl italic" style={{ color: 'var(--ui-muted-text)' }}>The Archive</h1>
                <p className="font-mono text-sm mt-2" style={{ color: 'var(--ui-muted-text)' }}>Shuffle, drag, and click to reveal.</p>
            </div>

            {/* Global Bottom Note */}
            <div className="fixed bottom-6 right-6 font-mono text-[10px] text-right z-0 pointer-events-none" style={{ color: 'var(--ui-muted-text)' }}>
                <p>SYSTEM: 52-CARD-GRID</p>
                <p>REF: ALTERIA MATERA</p>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Global Overlay for when a card is clicked */}
            <div
                id="overlay"
                className={`overlay ${activeExpandedId ? "active" : ""}`}
                onClick={handleClose}
            />

            {/* Render the stack of interactive cards */}
            {cards.map((card) => (
                <Card
                    key={card.id}
                    id={card.id}
                    initialTop={card.initialTop}
                    initialLeft={card.initialLeft}
                    initialRotation={card.initialRotation}
                    content={{ front: card.front, back: card.back }}
                    isExpanded={activeExpandedId === card.id}
                    onExpand={handleExpand}
                    onClose={handleClose}
                    bringToFront={handleBringToFront}
                />
            ))}
        </>
    );
}
