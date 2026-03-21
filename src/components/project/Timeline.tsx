"use client";

import { TimelineItem } from "@/lib/types";
import { EditableText } from "@/components/editor/EditableText";
import { EditableImage } from "@/components/editor/EditableImage";
import { useEditMode } from "@/components/editor/EditModeContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./Timeline.module.css";

interface TimelineProps {
    items: TimelineItem[];
    projectId: string;
    blockIndex: number;
}

export function Timeline({ items, projectId, blockIndex }: TimelineProps) {
    const { isEditMode } = useEditMode();
    const router = useRouter();
    const [isAdding, setIsAdding] = useState<number | null>(null);
    const [isAddingRow, setIsAddingRow] = useState(false);
    const [removingRow, setRemovingRow] = useState<number | null>(null);
    const [removingImage, setRemovingImage] = useState<string | null>(null);

    const handleAddRow = async () => {
        try {
            setIsAddingRow(true);
            const res = await fetch("/api/content/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, type: "timelineRow", blockIndex }),
            });
            if (res.ok) {
                router.refresh();
            } else {
                alert("Nepodařilo se přidat událost.");
            }
        } catch (error) {
            console.error(error);
            alert("Chyba při přidávání události.");
        } finally {
            setIsAddingRow(false);
        }
    };

    const handleRemoveRow = async (index: number) => {
        if (!confirm("Opravdu chcete smazat tuto událost?")) return;
        try {
            setRemovingRow(index);
            const res = await fetch("/api/content/remove", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, type: "timelineRow", blockIndex, index }),
            });
            if (res.ok) {
                router.refresh();
            } else {
                alert("Nepodařilo se smazat událost.");
            }
        } catch (error) {
            console.error(error);
            alert("Chyba při mazání události.");
        } finally {
            setRemovingRow(null);
        }
    };

    const handleRemoveImage = async (timelineIndex: number, imageIndex: number, url: string) => {
        if (!confirm("Opravdu chcete smazat tento obrázek?")) return;
        try {
            setRemovingImage(`${timelineIndex}-${imageIndex}`);
            // Also attempt to delete the physical file if it's stored on Supabase
            if (url.includes("/storage/v1/object/public/media/")) {
                await fetch("/api/upload", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url }),
                });
            }

            const res = await fetch("/api/content/remove", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, type: "timelineImage", blockIndex, timelineIndex, imageIndex }),
            });
            if (res.ok) {
                router.refresh();
            } else {
                alert("Nepodařilo se smazat obrázek.");
            }
        } catch (error) {
            console.error(error);
            alert("Chyba při mazání obrázku.");
        } finally {
            setRemovingImage(null);
        }
    };

    const handleAddImage = async (index: number) => {
        try {
            setIsAdding(index);
            const res = await fetch("/api/content/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, type: "timelineImage", blockIndex, timelineIndex: index }),
            });
            if (res.ok) {
                router.refresh();
            } else {
                alert("Nepodařilo se přidat obrázek.");
            }
        } catch (error) {
            console.error(error);
            alert("Chyba při přidávání obrázku.");
        } finally {
            setIsAdding(null);
        }
    };

    return (
        <section className={styles.timeline}>
            <div className={styles.timelineHeader}>
                <h2 className={`${styles.sectionTitle} text-h2`}>Průběh stavby</h2>
                {isEditMode && (
                    <button
                        className={styles.addRowBtn}
                        onClick={handleAddRow}
                        disabled={isAddingRow}
                    >
                        {isAddingRow ? "Přidávám..." : "+ Přidat novou událost"}
                    </button>
                )}
            </div>

            <div className={styles.axis}>
                {items.map((item, i) => (
                    <div key={item.id} className={styles.node}>
                        {isEditMode && (
                            <button
                                className={styles.deleteRowBtn}
                                onClick={() => handleRemoveRow(i)}
                                disabled={removingRow === i}
                                title="Zrušit událost"
                            >
                                ✕ Zrušit událost
                            </button>
                        )}
                        {/* Vertical line */}
                        <div className={styles.lineContainer}>
                            <div
                                className={`${styles.line} ${i === 0 ? styles.lineFirst : ""} ${i === items.length - 1 ? styles.lineLast : ""
                                    }`}
                            />
                            <div className={styles.dot} />
                        </div>

                        {/* Content */}
                        <div className={styles.content}>
                            <EditableText
                                value={item.date}
                                path={`blocks.${blockIndex}.data.${i}.date`}
                                projectId={projectId}
                                as="span"
                                className={styles.date}
                            />
                            <EditableText
                                value={item.title}
                                path={`blocks.${blockIndex}.data.${i}.title`}
                                projectId={projectId}
                                as="h3"
                                className={styles.nodeTitle}
                            />
                            <EditableText
                                value={item.description}
                                path={`blocks.${blockIndex}.data.${i}.description`}
                                projectId={projectId}
                                as="p"
                                className={styles.description}
                                multiline
                            />

                            {/* Horizontal gallery */}
                            {(item.images.length > 0 || isEditMode) && (
                                <div className={`${styles.gallery} scrollbar-hide`}>
                                    {item.images.map((img, j) => (
                                        <figure key={j} className={styles.galleryItem}>
                                            <EditableImage
                                                src={img.url}
                                                alt={img.caption}
                                                path={`blocks.${blockIndex}.data.${i}.images.${j}.url`}
                                                projectId={projectId}
                                            />
                                            {isEditMode && (
                                                <button
                                                    className={styles.deleteGalleryItemBtn}
                                                    onClick={() => handleRemoveImage(i, j, img.url)}
                                                    disabled={removingImage === `${i}-${j}`}
                                                    title="Zrušit celou položku"
                                                >
                                                    ✕ Zrušit celou položku
                                                </button>
                                            )}
                                            <figcaption className={styles.galleryCaption}>
                                                <EditableText
                                                    value={img.caption}
                                                    path={`blocks.${blockIndex}.data.${i}.images.${j}.caption`}
                                                    projectId={projectId}
                                                />
                                            </figcaption>
                                        </figure>
                                    ))}
                                    {isEditMode && (
                                        <button
                                            onClick={() => handleAddImage(i)}
                                            disabled={isAdding === i}
                                            className={styles.addGalleryItemBtn}
                                        >
                                            {isAdding === i ? "Přidávám..." : "+ Přidat fotku"}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
