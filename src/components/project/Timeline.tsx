"use client";

import { TimelineItem } from "@/lib/types";
import { EditableText } from "@/components/editor/EditableText";
import { EditableImage } from "@/components/editor/EditableImage";
import { useEditMode } from "@/components/editor/EditModeContext";
import { useDialog } from "@/components/ui/DialogContext";
import { useToast } from "@/components/ui/ToastContext";
import { Lightbox } from "@/components/ui/Lightbox";
import { useState, useRef, useEffect, useCallback } from "react";
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
    const { showConfirm } = useDialog();
    const { showToast } = useToast();
    const [isAdding, setIsAdding] = useState<number | null>(null);
    const [isAddingRow, setIsAddingRow] = useState(false);
    const [removingRow, setRemovingRow] = useState<number | null>(null);
    const [removingImage, setRemovingImage] = useState<string | null>(null);
    const [lightboxData, setLightboxData] = useState<{ eventIndex: number, imageIndex: number } | null>(null);

    // Robust optimistic state sync
    const serverHash = (items || []).map(i => `${i.id}-${i.title}-${i.images.length}`).join('|');
    const [lastSyncedHash, setLastSyncedHash] = useState(serverHash);
    const [itemsConfig, setItemsConfig] = useState(items || []);

    useEffect(() => {
        const currentServerHash = (items || []).map(i => `${i.id}-${i.title}-${i.images.length}`).join('|');
        if (currentServerHash !== lastSyncedHash) {
            setItemsConfig(items || []);
            setLastSyncedHash(currentServerHash);
        }
    }, [items, lastSyncedHash]);

    const handleAddRow = async () => {
        try {
            setIsAddingRow(true);
            
            // Optimistic Row Addition
            const tempId = `temp-${Date.now()}`;
            setItemsConfig(prev => [...prev, {
                id: tempId,
                date: "Nový rok",
                title: "Nová událost",
                description: "Popis nové události",
                images: []
            }]);

            showToast("saving");

            const res = await fetch("/api/content/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, type: "timelineRow", blockIndex }),
            });
            if (res.ok) {
                showToast("success");
                router.refresh();
            } else {
                showToast("error", "Nepodařilo se přidat událost.");
                // Sync back on error
                setItemsConfig(items || []);
            }
        } catch (error) {
            console.error(error);
            showToast("error", "Chyba při přidávání události.");
            setItemsConfig(items || []);
        } finally {
            setIsAddingRow(false);
        }
    };

    const handleRemoveRow = useCallback(async (index: number) => {
        showConfirm({
            title: "Opravdu chcete smazat tuto událost?",
            onConfirm: async () => {
                try {
                    setRemovingRow(index);
                    setItemsConfig(prev => prev.filter((_, i) => i !== index)); // Optimistic UI
                    showToast("saving");
                    
                    const res = await fetch("/api/content/remove", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ projectId, type: "timelineRow", blockIndex, index }),
                    });
                    if (res.ok) {
                        showToast("success");
                        router.refresh();
                    } else {
                        showToast("error", "Nepodařilo se smazat událost.");
                    }
                } catch (error) {
                    console.error(error);
                    showToast("error", "Chyba při mazání události.");
                } finally {
                    setRemovingRow(null);
                }
            }
        });
    }, [projectId, blockIndex, router, showConfirm, showToast]);

    const handleRemoveImage = useCallback(async (timelineIndex: number, imageIndex: number, url: string) => {
        showConfirm({
            title: "Opravdu chcete smazat tento obrázek?",
            onConfirm: async () => {
                try {
                    setRemovingImage(`${timelineIndex}-${imageIndex}`);
                    
                    // Optimistic UI for image deletion
                    setItemsConfig(prev => {
                        const newItems = [...prev];
                        newItems[timelineIndex] = {
                            ...newItems[timelineIndex],
                            images: newItems[timelineIndex].images.filter((_, i) => i !== imageIndex)
                        };
                        return newItems;
                    });

                    // Also attempt to delete the physical file if it's stored on Supabase
                    if (url.includes("/storage/v1/object/public/media/")) {
                        await fetch("/api/upload", {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ url }),
                        });
                    }
                    
                    showToast("saving");

                    const res = await fetch("/api/content/remove", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ projectId, type: "timelineImage", blockIndex, timelineIndex, imageIndex }),
                    });
                    if (res.ok) {
                        showToast("success");
                        router.refresh();
                    } else {
                        showToast("error", "Nepodařilo se smazat obrázek.");
                    }
                } catch (error) {
                    console.error(error);
                    showToast("error", "Chyba při mazání obrázku.");
                } finally {
                    setRemovingImage(null);
                }
            }
        });
    }, [projectId, blockIndex, router, showConfirm, showToast]);

    const handleAddImage = async (index: number) => {
        try {
            setIsAdding(index);
            showToast("saving");
            
            const res = await fetch("/api/content/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, type: "timelineImage", blockIndex, timelineIndex: index }),
            });
            if (res.ok) {
                // To keep it perfectly optimistic without complex server emulation, router.refresh handles it cleanly if possible
                showToast("success");
                router.refresh();
            } else {
                showToast("error", "Nepodařilo se přidat obrázek.");
            }
        } catch (error) {
            console.error(error);
            showToast("error", "Chyba při přidávání obrázku.");
        } finally {
            setIsAdding(null);
        }
    };

    if ((!itemsConfig || itemsConfig.length === 0) && !isEditMode) return null;

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
                {itemsConfig.map((item, i) => (
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
                                className={`${styles.line} ${i === 0 ? styles.lineFirst : ""} ${i === itemsConfig.length - 1 ? styles.lineLast : ""
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

            {lightboxData !== null && itemsConfig[lightboxData.eventIndex] && (
                <Lightbox
                    images={itemsConfig[lightboxData.eventIndex].images.map((img) => ({ url: img.url, caption: img.caption }))}
                    initialIndex={lightboxData.imageIndex}
                    onClose={() => setLightboxData(null)}
                    onIndexChange={(newIndex) => setLightboxData({ eventIndex: lightboxData.eventIndex, imageIndex: newIndex })}
                />
            )}
        </section>
    );
}
