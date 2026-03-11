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
}

export function SectionWrapper({ children, blockId, projectId, blockIndex }: SectionWrapperProps) {
    const { isEditMode } = useEditMode();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

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
            <button
                className={styles.deleteSectionBtn}
                onClick={handleDelete}
                disabled={isDeleting}
                title="Zrušit sekci"
            >
                {isDeleting ? "..." : "✕ Zrušit sekci"}
            </button>
        </div>
    );
}
