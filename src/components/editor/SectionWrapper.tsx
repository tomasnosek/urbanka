"use client";

import { useEditMode } from "./EditModeContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./Editor.module.css";

interface SectionWrapperProps {
    children: React.ReactNode;
    blockId: string;
    projectId: string;
    blockIndex: number;
    totalBlocks: number;
}

export function SectionWrapper({ children, blockId, projectId, blockIndex, totalBlocks }: SectionWrapperProps) {
    const { isEditMode } = useEditMode();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isMoving, setIsMoving] = useState(false);

    const handleMove = async (direction: "up" | "down") => {
        const newIndex = direction === "up" ? blockIndex - 1 : blockIndex + 1;
        if (newIndex < 0 || newIndex >= totalBlocks) return;
        
        try {
            setIsMoving(true);
            const res = await fetch("/api/content/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    projectId, 
                    path: "blocks", 
                    oldIndex: blockIndex, 
                    newIndex 
                }),
            });
            if (res.ok) {
                router.refresh();
            } else {
                alert("Nepodařilo se přesunout sekci.");
            }
        } catch (error) {
            console.error(error);
            alert("Chyba při přesunu sekce.");
        } finally {
            setIsMoving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Opravdu chcete odstranit tuto sekci?")) return;

        try {
            setIsDeleting(true);
            const res = await fetch("/api/content/remove", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, type: "block", blockIndex }),
            });
            if (res.ok) {
                router.refresh();
            } else {
                alert("Nepodařilo se smazat sekci.");
            }
        } catch (error) {
            console.error(error);
            alert("Chyba při mazání sekce.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isEditMode) {
        return <>{children}</>;
    }

    return (
        <div className={styles.sectionWrapper} data-block-id={blockId}>
            {children}
            <div className={styles.sectionActions}>
                {blockIndex > 0 && (
                    <button
                        className={styles.sectionActionBtn}
                        onClick={() => handleMove("up")}
                        disabled={isMoving || isDeleting}
                        title="Posunout nahoru"
                    >
                        ↑ Nahoru
                    </button>
                )}
                {blockIndex < totalBlocks - 1 && (
                    <button
                        className={styles.sectionActionBtn}
                        onClick={() => handleMove("down")}
                        disabled={isMoving || isDeleting}
                        title="Posunout dolů"
                    >
                        ↓ Dolů
                    </button>
                )}
                <button
                    className={`${styles.sectionActionBtn} ${styles.delete}`}
                    onClick={handleDelete}
                    disabled={isMoving || isDeleting}
                    title="Zrušit sekci"
                >
                    {isDeleting ? "..." : "✕ Zrušit"}
                </button>
            </div>
        </div>
    );
}
