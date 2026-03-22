"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface LightboxProps {
    images: { url: string; caption?: string }[];
    initialIndex: number;
    onClose: () => void;
    onIndexChange: (index: number) => void;
}

export function Lightbox({ images, initialIndex, onClose, onIndexChange }: LightboxProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "ArrowLeft") {
                if (initialIndex > 0) onIndexChange(initialIndex - 1);
            } else if (e.key === "ArrowRight") {
                if (initialIndex < images.length - 1) onIndexChange(initialIndex + 1);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden"; // Prevent background scrolling

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [initialIndex, images.length, onClose, onIndexChange]);

    if (typeof window === "undefined") return null;

    const currentImage = images[initialIndex];

    return createPortal(
        <div
            style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.9)",
                zIndex: 99999,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(4px)"
            }}
            onClick={onClose}
        >
            <button
                onClick={onClose}
                style={{
                    position: "absolute",
                    top: "24px",
                    right: "24px",
                    background: "transparent",
                    color: "white",
                    border: "none",
                    fontSize: "32px",
                    cursor: "pointer",
                    padding: "8px",
                    zIndex: 10
                }}
            >
                ✕
            </button>

            {initialIndex > 0 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onIndexChange(initialIndex - 1);
                    }}
                    style={{
                        position: "absolute",
                        left: "24px",
                        background: "rgba(255,255,255,0.1)",
                        color: "white",
                        border: "none",
                        fontSize: "32px",
                        cursor: "pointer",
                        padding: "16px",
                        borderRadius: "50%",
                        zIndex: 10
                    }}
                >
                    &larr;
                </button>
            )}

            <div style={{ position: "relative", maxWidth: "90%", maxHeight: "85vh", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <img
                    src={currentImage.url}
                    alt={currentImage.caption || `Obrázek ${initialIndex + 1}`}
                    style={{
                        maxWidth: "100%",
                        maxHeight: "80vh",
                        objectFit: "contain",
                        borderRadius: "8px",
                        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                        cursor: "default"
                    }}
                    onClick={(e) => e.stopPropagation()}
                />
                
                {currentImage.caption && (
                    <div style={{ 
                        marginTop: "16px", 
                        color: "rgba(255,255,255,0.9)", 
                        fontSize: "16px", 
                        textAlign: "center", 
                        maxWidth: "800px" 
                    }}>
                        {currentImage.caption}
                    </div>
                )}
            </div>

            {initialIndex < images.length - 1 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onIndexChange(initialIndex + 1);
                    }}
                    style={{
                        position: "absolute",
                        right: "24px",
                        background: "rgba(255,255,255,0.1)",
                        color: "white",
                        border: "none",
                        fontSize: "32px",
                        cursor: "pointer",
                        padding: "16px",
                        borderRadius: "50%",
                        zIndex: 10
                    }}
                >
                    &rarr;
                </button>
            )}

            <div style={{ position: "absolute", bottom: "24px", color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
                {initialIndex + 1} / {images.length}
            </div>
        </div>,
        document.body
    );
}
