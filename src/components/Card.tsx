"use client";

import React, { useRef, useState, useEffect } from "react";

interface CardContent {
    front: React.ReactNode;
    back: React.ReactNode;
}

interface CardProps {
    id: string;
    initialTop: string;
    initialLeft: string;
    initialRotation: number;
    content: CardContent;
    isExpanded: boolean;
    onExpand: (id: string, ref: React.RefObject<HTMLDivElement | null>) => void;
    onClose: () => void;
    bringToFront: () => number; // Returns the new highest Z index
}

export default function Card({
    id,
    initialTop,
    initialLeft,
    initialRotation,
    content,
    isExpanded,
    onExpand,
    onClose,
    bringToFront,
}: CardProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    // Local state for dragging to preserve independence from global React layout cycles
    const [position, setPosition] = useState({ top: initialTop, left: initialLeft });
    const [isDragging, setIsDragging] = useState(false);
    const [zIndex, setZIndex] = useState(1);

    // We store dragging metadata in refs to avoid constant re-renders during mouse move
    const dragRef = useRef({
        startX: 0,
        startY: 0,
        originalLeft: 0,
        originalTop: 0,
        hasMoved: false
    });

    // Calculate random jitter on mount (as per the vanilla JS)
    const [rotation, setRotation] = useState(initialRotation);
    useEffect(() => {
        const randomRot = (Math.random() * 10) - 5;
        setRotation(initialRotation + randomRot);
    }, [initialRotation]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (isExpanded) return;

        // Check if dragging another card 
        // In actual implementation, we just bring this to front
        const newZ = bringToFront();
        setZIndex(newZ);

        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            originalLeft: cardRef.current?.offsetLeft || 0,
            originalTop: cardRef.current?.offsetTop || 0,
            hasMoved: false
        };

        setIsDragging(true);

        // Attach listeners to window so dragging works outside the bounding box
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);

        // Prevent default touch behaviors like scrolling
        if (e.target instanceof HTMLElement && e.target.hasPointerCapture(e.pointerId)) {
            e.target.releasePointerCapture(e.pointerId);
        }
    };

    const handlePointerMove = (e: PointerEvent) => {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;

        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            dragRef.current.hasMoved = true;
        }

        setPosition({
            top: `${dragRef.current.originalTop + dy}px`,
            left: `${dragRef.current.originalLeft + dx}px`
        });
    };

    const handlePointerUp = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        setIsDragging(false);
    };

    const handleClick = (e: React.MouseEvent) => {
        if (dragRef.current.hasMoved || isExpanded) {
            dragRef.current.hasMoved = false; // Reset
            return;
        }

        // If it's a click, expand it
        bringToFront();
        onExpand(id, cardRef);
    };

    return (
        <div
            ref={cardRef}
            className={`scene ${isDragging ? "dragging" : ""} ${isExpanded ? "is-expanded" : ""}`}
            style={{
                top: isExpanded ? "50%" : position.top,
                left: isExpanded ? "50%" : position.left,
                transform: isExpanded ? "translate(-50%, -50%) rotate(0deg)" : `rotate(${rotation}deg)`,
                zIndex: isExpanded ? 2000 : zIndex,
                touchAction: "none" // Prevent mobile scrolling while interacting
            }}
            onPointerDown={handlePointerDown}
            onClick={handleClick}
        >
            <div
                className={`card ${isExpanded ? "is-flipped" : ""}`}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Back of Card (Expanded Content) */}
                <div
                    className="card-face card-back flex flex-col"
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", backgroundColor: "var(--card-bg)" }}
                >
                    <div className="h-full w-full flex flex-col overflow-y-auto content-scroll relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose();
                            }}
                            className="absolute top-8 right-8 z-50 font-mono text-xs transition-colors px-2 py-1"
                            style={{
                                color: 'var(--card-accent)',
                                backgroundColor: 'var(--card-bg)',
                                border: '1px solid var(--card-accent)',
                            }}
                        >
                            [ CLOSE VIEW ]
                        </button>
                        {content.back}
                    </div>
                </div>

                {/* Front of Card (Suit Side) */}
                <div
                    className="card-face card-front p-5 flex flex-col justify-between"
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(0deg)" }}
                >
                    {content.front}
                </div>
            </div>
        </div>
    );
}
