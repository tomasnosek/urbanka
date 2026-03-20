/* =============================================
   URBANKA — EditableImage (inline image editing)
   ============================================= */

"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEditMode } from "@/components/editor/EditModeContext";
import { useToast } from "@/components/ui/ToastContext";
import styles from "./Editor.module.css";

const PLACEHOLDER = "/images/black.png";

interface EditableImageProps {
    /** Current image URL */
    src: string;
    /** Alt text */
    alt: string;
    /** JSONB path to the URL field, e.g. "hero.imageUrl" */
    path: string;
    /** Project ID */
    projectId: string;
    /** Additional class name for the img */
    className?: string;
    /** Additional class name for the wrapper */
    wrapperClassName?: string;
    /** Optional callback executed before uploading starts. Used to e.g. create a database entry first. */
    onBeforeUpload?: () => Promise<void>;
    /** Optional callback executed after successful upload. */
    onUploadSuccess?: (url: string) => void;
}

export function EditableImage({
    src,
    alt,
    path,
    projectId,
    className,
    wrapperClassName,
    onBeforeUpload,
    onUploadSuccess,
}: EditableImageProps) {
    const { isAdmin } = useAuth();
    const { isEditMode } = useEditMode();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentSrc, setCurrentSrc] = useState(src);
    const [uploading, setUploading] = useState(false);
    const { showToast } = useToast();

    const canEdit = isAdmin && isEditMode;
    const hasImage = currentSrc && currentSrc !== PLACEHOLDER;

    // Sync state if props change (e.g., from server revalidation)
    useEffect(() => {
        setCurrentSrc(src);
    }, [src]);

    const handleClick = useCallback(() => {
        if (!canEdit) return;
        fileInputRef.current?.click();
    }, [canEdit]);

    const handleDelete = useCallback(
        async (e: React.MouseEvent) => {
            e.stopPropagation();
            if (!canEdit || !hasImage) return;

            try {
                // First, remove the file from Supabase Storage
                if (currentSrc.includes("/storage/v1/object/public/media/")) {
                    await fetch("/api/upload", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: currentSrc }),
                    });
                }

                // Then update the content in the database to point to the placeholder
                const res = await fetch("/api/content", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        projectId,
                        path,
                        value: PLACEHOLDER,
                    }),
                });

                if (res.ok) {
                    setCurrentSrc(PLACEHOLDER);
                    showToast("success", "Obrázek smazán");
                } else {
                    console.error("Content delete failed:", await res.text());
                    showToast("error", "Nepodařilo se smazat obrázek");
                }
            } catch (err) {
                console.error("Delete error:", err);
                showToast("error", "Chyba při mazání obrázku");
            }
        },
        [canEdit, hasImage, projectId, path, currentSrc]
    );

    const handleFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setUploading(true);

            try {
                if (onBeforeUpload) {
                    await onBeforeUpload();
                }

                // Determine dimensions for max 800px height
                const img = new Image();
                const objectUrl = URL.createObjectURL(file);

                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = objectUrl;
                });

                let width = img.width;
                let height = img.height;
                const MAX_HEIGHT = 800;

                if (height > MAX_HEIGHT) {
                    width = Math.round((width * MAX_HEIGHT) / height);
                    height = MAX_HEIGHT;
                }

                // Draw to canvas for compression
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (!ctx) throw new Error("Canvas not supported");

                ctx.drawImage(img, 0, 0, width, height);
                URL.revokeObjectURL(objectUrl);

                // Export as WebP 80%
                const optimizedBlob = await new Promise<Blob | null>((resolve) => {
                    canvas.toBlob(resolve, "image/webp", 0.8);
                });

                if (!optimizedBlob) throw new Error("Compression failed");

                const formData = new FormData();
                // Send the blob as a file named "image.webp"
                formData.append("file", optimizedBlob, "image.webp");
                formData.append("projectId", projectId);
                formData.append("path", path);
                formData.append("revalidatePath", window.location.pathname);

                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (res.ok) {
                    const { url } = await res.json();
                    setCurrentSrc(url);
                    if (onUploadSuccess) onUploadSuccess(url);
                    showToast("success", "Obrázek nahrán");
                } else {
                    console.error("Upload failed:", await res.text());
                    showToast("error", "Nepodařilo se nahrát obrázek");
                }
            } catch (err) {
                console.error("Upload error:", err);
                showToast("error", "Chyba při nahrávání");
            } finally {
                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        },
        [projectId, path]
    );

    return (
        <div
            className={`${wrapperClassName ?? ""} ${canEdit ? styles.editableImageWrapper : ""} ${!hasImage ? styles.emptyPlaceholderWrapper : ""}`}
            onClick={hasImage ? undefined : handleClick}
        >
            <img
                src={currentSrc}
                alt={alt}
                className={`${className ?? ""} ${!hasImage ? styles.emptyPlaceholderImage : ""}`}
            />

            {canEdit && (
                <>
                    <div className={styles.imageOverlay}>
                        {uploading ? (
                            <span className={styles.overlayText}>
                                Nahrávám…
                            </span>
                        ) : (
                            <button
                                className={styles.overlayActionBtn}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClick();
                                }}
                            >
                                📷 Nahrát jiný obrázek
                            </button>
                        )}

                        {hasImage && !uploading && (
                            <button
                                className={styles.deleteImageBtn}
                                onClick={handleDelete}
                                title="Zrušit obrázek"
                            >
                                ✕ Zrušit obrázek
                            </button>
                        )}
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className={styles.hiddenInput}
                        onChange={handleFileChange}
                    />
                </>
            )}
        </div>
    );
}
