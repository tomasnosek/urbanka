/* =============================================
   URBANKA — EditableText (inline editing)
   ============================================= */

"use client";

import { useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEditMode } from "@/components/editor/EditModeContext";
import { useToast } from "@/components/ui/ToastContext";
import styles from "./Editor.module.css";

interface EditableTextProps {
    /** Current text value */
    value: string;
    /** JSONB path, e.g. "hero.title" */
    path: string;
    /** Project ID for API call */
    projectId: string;
    /** HTML tag to render */
    as?: keyof HTMLElementTagNameMap;
    /** Additional class name */
    className?: string;
    /** Is this multiline? (uses div instead of span for whitespace) */
    multiline?: boolean;
}

export function EditableText({
    value,
    path,
    projectId,
    as: Tag = "span",
    className,
    multiline = false,
}: EditableTextProps) {
    const { isAdmin } = useAuth();
    const { isEditMode } = useEditMode();
    const ref = useRef<HTMLElement>(null);
    const { showToast } = useToast();
    const router = useRouter();

    const handleBlur = useCallback(async () => {
        const el = ref.current;
        if (!el) return;

        const newValue = multiline
            ? el.innerText.trim()
            : el.textContent?.trim() ?? "";

        // Skip if unchanged
        if (newValue === value) return;

        try {
            const res = await fetch("/api/content", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    path,
                    value: newValue,
                }),
            });

            if (res.ok) {
                showToast("success");
                router.refresh();
            } else {
                console.error("Failed to save:", await res.text());
                showToast("error", "Nepodařilo se uložit");
                if (el) el.textContent = value;
            }
        } catch (err) {
            console.error("Save error:", err);
            showToast("error", "Chyba při ukládání");
            if (el) el.textContent = value;
        }
    }, [value, path, projectId, multiline, showToast, router]);

    const canEdit = isAdmin && isEditMode;
    const Component = Tag as any;

    return (
        <Component
            ref={ref}
            className={`${className ?? ""} ${canEdit ? styles.editable : ""}`}
            contentEditable={canEdit}
            suppressContentEditableWarning={canEdit}
            onBlur={canEdit ? handleBlur : undefined}
            spellCheck={canEdit ? false : undefined}
        >
            {value}
        </Component>
    );
}
