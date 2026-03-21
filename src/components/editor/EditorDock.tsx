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

    const handleAdd = async (type: "contentBlockLeft" | "contentBlockRight" | "galleryBlock" | "mayorBlock", variant?: string) => {
        try {
            setIsAdding(type);
            const res = await fetch("/api/content/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, type, variant }),
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

            {/* Category: Obsah s obrázkem */}
            <div className={styles.dockCategory}>
                <div className={styles.dockItem}>
                    <div className={styles.dockIcon}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="2" y="4" width="8" height="16" rx="2" fill="var(--color-slate-300)" />
                            <rect x="12" y="6" width="10" height="2" rx="1" fill="var(--color-slate-400)" />
                            <rect x="12" y="10" width="10" height="2" rx="1" fill="var(--color-slate-400)" />
                            <rect x="12" y="14" width="6" height="2" rx="1" fill="var(--color-slate-400)" />
                        </svg>
                    </div>
                    <span className={styles.dockLabel}>Obrázek a text</span>
                </div>
                <div className={styles.dockSubmenu}>
                    <button className={styles.submenuItem} onClick={() => handleAdd("contentBlockLeft")} disabled={isAdding !== null}>
                        Obrázek vlevo
                    </button>
                    <button className={styles.submenuItem} onClick={() => handleAdd("contentBlockRight")} disabled={isAdding !== null}>
                        Obrázek vpravo
                    </button>
                </div>
            </div>

            {/* Category: Fotogalerie */}
            <div className={styles.dockCategory}>
                <div className={styles.dockItem}>
                    <div className={styles.dockIcon}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="4" width="8" height="7" rx="1.5" fill="var(--color-slate-300)" />
                            <rect x="13" y="4" width="8" height="7" rx="1.5" fill="var(--color-slate-300)" />
                            <rect x="3" y="13" width="8" height="7" rx="1.5" fill="var(--color-slate-300)" />
                            <rect x="13" y="13" width="8" height="7" rx="1.5" fill="var(--color-slate-300)" />
                        </svg>
                    </div>
                    <span className={styles.dockLabel}>Fotogalerie</span>
                </div>
                <div className={styles.dockSubmenu}>
                    <button className={styles.submenuItem} onClick={() => handleAdd("galleryBlock")} disabled={isAdding !== null}>
                        Základní mřížka
                    </button>
                </div>
            </div>

            {/* Category: Slovo starosty */}
            <div className={styles.dockCategory}>
                <div className={styles.dockItem}>
                    <div className={styles.dockIcon}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="8" r="4" fill="var(--color-slate-300)" />
                            <rect x="6" y="14" width="12" height="6" rx="2" fill="var(--color-slate-300)" />
                        </svg>
                    </div>
                    <span className={styles.dockLabel}>Slovo starosty</span>
                </div>
                <div className={styles.dockSubmenu}>
                    <button className={styles.submenuItem} onClick={() => handleAdd("mayorBlock", "variant-1")} disabled={isAdding !== null}>
                        Pouze text (Varianta 1)
                    </button>
                    <button className={styles.submenuItem} onClick={() => handleAdd("mayorBlock", "variant-2")} disabled={isAdding !== null}>
                        S fotkou (Varianta 2)
                    </button>
                </div>
            </div>

        </div>
    );
}
