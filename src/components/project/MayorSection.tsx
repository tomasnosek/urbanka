"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useEditMode } from "@/components/editor/EditModeContext";
import { EditableText } from "@/components/editor/EditableText";
import { EditableImage } from "@/components/editor/EditableImage";
import { useToast } from "@/components/ui/ToastContext";
import { useRouter } from "next/navigation";
import styles from "./MayorSection.module.css";
import type { MayorBlockData } from "@/lib/types";

interface MayorSectionProps {
    block: MayorBlockData;
    projectId: string;
    blockIndex: number;
}

export function MayorSection({ block, projectId, blockIndex }: MayorSectionProps) {
    const { isAdmin } = useAuth();
    const { isEditMode } = useEditMode();
    const router = useRouter();
    const { showToast } = useToast();

    // Default to variant-1 if undefined
    const isVariant2 = block.variant === "variant-2";
    const canEdit = isAdmin && isEditMode;

    const toggleVariant = async () => {
        const newVariant = isVariant2 ? "variant-1" : "variant-2";
        try {
            const res = await fetch("/api/content", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    path: `blocks.${blockIndex}.data.variant`,
                    value: newVariant,
                }),
            });
            if (res.ok) {
                showToast("success", "Varianta změněna");
                router.refresh();
            } else {
                showToast("error", "Chyba při změně varianty");
            }
        } catch (e) {
            showToast("error", "Chyba při změně varianty");
        }
    };

    return (
        <section className={`${styles.mayorSection} ${isVariant2 ? styles.variant2 : styles.variant1}`}>
            {canEdit && (
                <div className={styles.adminToolbar}>
                    <button className={styles.toggleBtn} onClick={toggleVariant}>
                        Přepnout variantu (nyní: {block.variant || "variant-1"})
                    </button>
                </div>
            )}
            
            <div className={styles.container}>
                {isVariant2 && (
                    <EditableImage
                        src={block.imageUrl || "/images/black.png"}
                        alt="Fotografie k citátu"
                        path={`blocks.${blockIndex}.data.imageUrl`}
                        projectId={projectId}
                        wrapperClassName={styles.imageWrapper}
                    />
                )}
                
                <div className={styles.textColumn}>
                    <div className={styles.quoteWrapper}>
                        <EditableText
                            value={block.quote}
                            path={`blocks.${blockIndex}.data.quote`}
                            projectId={projectId}
                            as="blockquote"
                            className={`${styles.quote} text-h3`}
                            multiline
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
