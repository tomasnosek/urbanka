"use client";

import { useEditMode } from "./EditModeContext";
import styles from "./Editor.module.css";

interface SectionWrapperProps {
    children: React.ReactNode;
    blockId: string;
    blockIndex: number;
    totalBlocks: number;
    onMove: (direction: "up" | "down") => void;
    onDelete: () => void;
}

export function SectionWrapper({
    children,
    blockId,
    blockIndex,
    totalBlocks,
    onMove,
    onDelete,
}: SectionWrapperProps) {
    const { isEditMode } = useEditMode();

    if (!isEditMode) {
        return <>{children}</>;
    }

    const handleDeleteClick = () => {
        if (!confirm("Opravdu chcete odstranit tuto sekci?")) return;
        onDelete();
    };

    return (
        <div className={styles.sectionWrapper} data-block-id={blockId}>
            {children}
            <div className={styles.sectionActions}>
                {blockIndex > 0 && (
                    <button
                        className={styles.sectionActionBtn}
                        onClick={() => onMove("up")}
                        title="Posunout nahoru"
                    >
                        ↑ Nahoru
                    </button>
                )}
                {blockIndex < totalBlocks - 1 && (
                    <button
                        className={styles.sectionActionBtn}
                        onClick={() => onMove("down")}
                        title="Posunout dolů"
                    >
                        ↓ Dolů
                    </button>
                )}
                <button
                    className={`${styles.sectionActionBtn} ${styles.delete}`}
                    onClick={handleDeleteClick}
                    title="Zrušit sekci"
                >
                    ✕ Zrušit
                </button>
            </div>
        </div>
    );
}
