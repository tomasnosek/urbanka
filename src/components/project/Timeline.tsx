"use client";

import { TimelineItem } from "@/lib/types";
import { EditableText } from "@/components/editor/EditableText";
import { EditableImage } from "@/components/editor/EditableImage";
import { useEditMode } from "@/components/editor/EditModeContext";
import { Lightbox } from "@/components/ui/Lightbox";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./Timeline.module.css";

interface TimelineProps {
    items: TimelineItem[];
    projectId: string;
    blockIndex: number;
}

function ScrollableGallery({ children, isEditMode }: { children: React.ReactNode; isEditMode: boolean }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!scrollRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    };

    useEffect(() => {
        if (isEditMode && scrollRef.current) {
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
                }
            }, 100);
        }
    }, [isEditMode, children]);

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const handlePointerUp = () => {
        setIsDragging(false);
    };

    const scrollBy = (amount: number) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
        }
    };

    return (
        <div className={styles.galleryWrapper}>
            <div 
                className={`${styles.gallery} scrollbar-hide ${isDragging ? styles.isDragging : ""}`}
                ref={scrollRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                {children}
            </div>

            <div className={styles.galleryControls}>
                <button 
                    className={styles.scrollBtn}
                    onClick={() => scrollBy(-300)}
                    aria-label="Posunout doleva"
                >
                    ←
                </button>
                <button 
                    className={styles.scrollBtn}
                    onClick={() => scrollBy(300)}
                    aria-label="Posunout doprava"
                >
                    →
                </button>
            </div>
        </div>
    );
}

export function Timeline({ items, projectId, blockIndex }: TimelineProps) {
    const { isEditMode } = useEditMode();
    const router = useRouter();
    const [isAdding, setIsAdding] = useState<number | null>(null);
    const [isAddingRow, setIsAddingRow] = useState(false);
    const [removingRow, setRemovingRow] = useState<number | null>(null);
    const [removingImage, setRemovingImage] = useState<string | null>(null);
    const [lightboxData, setLightboxData] = useState<{ eventIndex: number, imageIndex: number } | null>(null);

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

    if ((!items || items.length === 0) && !isEditMode) return null;

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
                                <ScrollableGallery isEditMode={isEditMode}>
                                    {item.images.map((img, j) => (
                                        <figure key={j} className={styles.galleryItem}>
                                            <EditableImage
                                                src={img.url}
                                                alt={img.caption}
                                                path={`blocks.${blockIndex}.data.${i}.images.${j}.url`}
                                                projectId={projectId}
                                                onImageClick={() => setLightboxData({ eventIndex: i, imageIndex: j })}
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
                                            {(isEditMode || (img.caption && img.caption !== "Nový obrázek")) && (
                                                <figcaption className={styles.galleryCaption}>
                                                    <EditableText
                                                        value={img.caption}
                                                        path={`blocks.${blockIndex}.data.${i}.images.${j}.caption`}
                                                        projectId={projectId}
                                                    />
                                                </figcaption>
                                            )}
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
                                </ScrollableGallery>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {lightboxData !== null && items[lightboxData.eventIndex] && (
                <Lightbox
                    images={items[lightboxData.eventIndex].images.map((img) => ({ url: img.url, caption: img.caption }))}
                    initialIndex={lightboxData.imageIndex}
                    onClose={() => setLightboxData(null)}
                    onIndexChange={(newIndex) => setLightboxData({ eventIndex: lightboxData.eventIndex, imageIndex: newIndex })}
                />
            )}
        </section>
    );
}
