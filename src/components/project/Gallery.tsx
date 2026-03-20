"use client";

import { TimelineImage } from "@/lib/types";
import { EditableImage } from "@/components/editor/EditableImage";
import { EditableText } from "@/components/editor/EditableText";
import { useEditMode } from "@/components/editor/EditModeContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from "./Gallery.module.css";

// Individual Gallery Item Component
function SortableGalleryItem({
    image,
    timelineIndex,
    projectId,
    blockIndex,
    isEditMode,
    onRemove,
}: {
    image: TimelineImage & { id: string };
    timelineIndex: number;
    projectId: string;
    blockIndex: number;
    isEditMode: boolean;
    onRemove: (index: number, url: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: image.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 2 : 1,
        opacity: isDragging ? 0.8 : 1,
    };

    return (
        <figure
            ref={setNodeRef}
            style={style}
            className={`${styles.galleryItem} ${isDragging ? styles.dragging : ""}`}
        >
            <div className={styles.imageWrapper}>
                <EditableImage
                    src={image.url}
                    alt={image.caption}
                    path={`blocks.${blockIndex}.data.${timelineIndex}.url`}
                    projectId={projectId}
                />
                
                {isEditMode && (
                    <div className={styles.editControls}>
                        {/* Drag Handle */}
                        <div
                            className={styles.dragHandle}
                            {...attributes}
                            {...listeners}
                            title="Přesunout fotku"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 6C8 7.10457 7.10457 8 6 8C4.89543 8 4 7.10457 4 6C4 4.89543 4.89543 4 6 4C7.10457 4 8 4.89543 8 6Z" fill="white" />
                                <path d="M8 12C8 13.1046 7.10457 14 6 14C4.89543 14 4 13.1046 4 12C4 10.8954 4.89543 10 6 10C7.10457 10 8 10.8954 8 12Z" fill="white" />
                                <path d="M8 18C8 19.1046 7.10457 20 6 20C4.89543 20 4 19.1046 4 18C4 16.8954 4.89543 16 6 16C7.10457 16 8 16.8954 8 18Z" fill="white" />
                                <path d="M14 6C14 7.10457 13.1046 8 12 8C10.8954 8 10 7.10457 10 6C10 4.89543 10.8954 4 12 4C13.1046 4 14 4.89543 14 6Z" fill="white" />
                                <path d="M14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12Z" fill="white" />
                                <path d="M14 18C14 19.1046 13.1046 20 12 20C10.8954 20 10 19.1046 10 18C10 16.8954 10.8954 16 12 16C13.1046 16 14 16.8954 14 18Z" fill="white" />
                                <path d="M20 6C20 7.10457 19.1046 8 18 8C16.8954 8 16 7.10457 16 6C16 4.89543 16.8954 4 18 4C19.1046 4 20 4.89543 20 6Z" fill="white" />
                                <path d="M20 12C20 13.1046 19.1046 14 18 14C16.8954 14 16 13.1046 16 12C16 10.8954 16.8954 10 18 10C19.1046 10 20 10.8954 20 12Z" fill="white" />
                                <path d="M20 18C20 19.1046 19.1046 20 18 20C16.8954 20 16 19.1046 16 18C16 16.8954 16.8954 16 18 16C19.1046 16 20 16.8954 20 18Z" fill="white" />
                            </svg>
                        </div>
                        {/* Remove Button */}
                        <button
                            className={styles.deleteBtn}
                            onClick={() => onRemove(timelineIndex, image.url)}
                            title="Smazat fotku z galerie"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>
            {(image.caption || isEditMode) && (
                <figcaption className={styles.galleryCaption}>
                    <EditableText
                        value={image.caption}
                        path={`blocks.${blockIndex}.data.${timelineIndex}.caption`}
                        projectId={projectId}
                        as="span"
                    />
                </figcaption>
            )}
        </figure>
    );
}


interface GalleryProps {
    images: (TimelineImage & { id?: string })[];
    projectId: string;
    blockIndex: number;
}

export function Gallery({ images, projectId, blockIndex }: GalleryProps) {
    const { isEditMode } = useEditMode();
    const router = useRouter();
    const [removingImage, setRemovingImage] = useState<number | null>(null);

    // Robust optimistic state sync:
    // We construct a hash of the *server* images to detect when the server actually caught up
    // to our changes, or if another user edited the project.
    const serverHash = images.map(img => img.url).join('|');
    const [lastSyncedHash, setLastSyncedHash] = useState(serverHash);

    const [items, setItems] = useState(() => 
        images.map((img, i) => ({
            ...img,
            id: img.id || `gallery-img-${img.url}-${i}`,
        }))
    );

    useEffect(() => {
        const currentServerHash = images.map(img => img.url).join('|');
        if (currentServerHash !== lastSyncedHash) {
            setItems(images.map((img, i) => ({
                ...img,
                id: img.id || `gallery-img-${img.url}-${i}`,
            })));
            setLastSyncedHash(currentServerHash);
        }
    }, [images, lastSyncedHash]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            // Require mouse to move 5px before drag starts - prevents accidental drags when clicking overlay buttons
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleRemoveImage = async (index: number, url: string) => {
        if (!confirm("Opravdu chcete smazat tento obrázek?")) return;
        try {
            setRemovingImage(index);
            // Optimistically remove it from local state to hide it instantly
            setItems(prev => prev.filter((_, i) => i !== index));

            // Attempt to delete physical file from Supabase
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
                body: JSON.stringify({ 
                    projectId, 
                    type: "galleryImage", 
                    blockIndex, 
                    imageIndex: index,
                    revalidatePath: window.location.pathname
                }),
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

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over?.id);

            // Optimistic UI update
            setItems((items) => arrayMove(items, oldIndex, newIndex));

            // Call API
            try {
                const res = await fetch("/api/content/reorder", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        projectId, 
                        path: `blocks.${blockIndex}.data`,
                        oldIndex,
                        newIndex
                    }),
                });
                
                if (!res.ok) {
                    alert("Nepodařilo se uložit nové pořadí galerie.");
                    // In a real prod app, you might rollback the optimistic state here
                }
            } catch (error) {
                console.error(error);
                alert("Chyba při ukládání pořadí. Zkuste to znovu.");
            }
        }
    };

    return (
        <section className={styles.galleryContainer}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <div className={styles.grid}>
                    <SortableContext
                        items={items}
                        strategy={rectSortingStrategy}
                    >
                        {items.map((image, index) => (
                            <SortableGalleryItem
                                key={image.id}
                                image={image}
                                timelineIndex={index}
                                projectId={projectId}
                                blockIndex={blockIndex}
                                isEditMode={isEditMode}
                                onRemove={handleRemoveImage}
                            />
                        ))}
                    </SortableContext>

                    {isEditMode && (
                        <figure key={`extra-slot-${items.length}`} className={styles.galleryItem}>
                            <div className={styles.imageWrapper}>
                                <EditableImage
                                    src="/images/black.png"
                                    alt="Přidat nový obrázek"
                                    path={`blocks.${blockIndex}.data.${items.length}.url`}
                                    projectId={projectId}
                                    onBeforeUpload={async () => {
                                        const res = await fetch("/api/content/add", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ projectId, type: "galleryImage", blockIndex, revalidatePath: window.location.pathname }),
                                        });
                                        if (!res.ok) throw new Error("Nepodařilo se vytvořit slot v galerii");
                                    }}
                                    onUploadSuccess={(url) => {
                                        // Optimistically add the new uploaded image to the local list,
                                        // so that the next empty slot remounts clean!
                                        setItems(prev => [
                                            ...prev,
                                            { id: Date.now().toString(), url, caption: "" }
                                        ]);
                                        router.refresh();
                                    }}
                                />
                            </div>
                        </figure>
                    )}
                </div>
            </DndContext>
        </section>
    );
}
