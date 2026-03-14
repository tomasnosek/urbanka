"use client";

import { useEditMode } from "@/components/editor/EditModeContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Editor.module.css";

interface EditorDockProps {
    projectId: string;
}

export function EditorDock({ projectId }: EditorDockProps) {
    const { isEditMode } = useEditMode();
    const router = useRouter();
    const [isAdding, setIsAdding] = useState<string | null>(null);

    // Only render the dock when in edit mode
    if (!isEditMode) return null;

    const handleAdd = async (type: "contentBlockLeft" | "contentBlockRight" | "galleryBlock") => {
        try {
            setIsAdding(type);
            const res = await fetch("/api/content/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, type }),
            });
            if (res.ok) {
                router.refresh();
            } else {
                alert("Nepodařilo se přidat blok.");
            }
        } catch (error) {
            console.error(error);
            alert("Chyba při přidávání bloku.");
        } finally {
            setIsAdding(null);
        }
    };

    return (
        <div className={styles.dock}>
            {/* Thumbnail: Image Left */}
            <button
                className={styles.dockItem}
                onClick={() => handleAdd("contentBlockLeft")}
                disabled={isAdding !== null}
            >
                <div className={styles.dockIcon}>
                    {/* Simple abstract icon for image-left block */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="4" width="8" height="16" rx="2" fill="var(--color-slate-300)" />
                        <rect x="12" y="6" width="10" height="2" rx="1" fill="var(--color-slate-400)" />
                        <rect x="12" y="10" width="10" height="2" rx="1" fill="var(--color-slate-400)" />
                        <rect x="12" y="14" width="6" height="2" rx="1" fill="var(--color-slate-400)" />
                    </svg>
                </div>
                <span className={styles.dockLabel}>
                    Obrázek vlevo
                </span>
            </button>

            {/* Thumbnail: Image Right */}
            <button
                className={styles.dockItem}
                onClick={() => handleAdd("contentBlockRight")}
                disabled={isAdding !== null}
            >
                <div className={styles.dockIcon}>
                    {/* Simple abstract icon for image-right block */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="14" y="4" width="8" height="16" rx="2" fill="var(--color-slate-300)" />
                        <rect x="2" y="6" width="10" height="2" rx="1" fill="var(--color-slate-400)" />
                        <rect x="2" y="10" width="10" height="2" rx="1" fill="var(--color-slate-400)" />
                        <rect x="2" y="14" width="6" height="2" rx="1" fill="var(--color-slate-400)" />
                    </svg>
                </div>
                <span className={styles.dockLabel}>
                    Obrázek vpravo
                </span>
            </button>

            {/* Thumbnail: Gallery */}
            <button
                className={styles.dockItem}
                onClick={() => handleAdd("galleryBlock")}
                disabled={isAdding !== null}
            >
                <div className={styles.dockIcon}>
                    {/* Abstract icon for grid/gallery block */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="4" width="8" height="7" rx="1.5" fill="var(--color-slate-300)" />
                        <rect x="13" y="4" width="8" height="7" rx="1.5" fill="var(--color-slate-300)" />
                        <rect x="3" y="13" width="8" height="7" rx="1.5" fill="var(--color-slate-300)" />
                        <rect x="13" y="13" width="8" height="7" rx="1.5" fill="var(--color-slate-300)" />
                    </svg>
                </div>
                <span className={styles.dockLabel}>
                    Fotogalerie
                </span>
            </button>
        </div>
    );
}
