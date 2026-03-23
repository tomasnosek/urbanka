"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { EditableText } from "@/components/editor/EditableText";
import { useEditMode } from "@/components/editor/EditModeContext";
import { useDialog } from "@/components/ui/DialogContext";
import { useToast } from "@/components/ui/ToastContext";
import { PROJECT_PROPERTIES } from "@/lib/projectProperties";
import styles from "./StatsBar.module.css";
import type { StatItem } from "@/lib/types";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface StatsBarProps {
    stats: StatItem[];
    projectId: string;
    blockIndex: number;
}

function SortableStatItem({
    stat,
    index,
    projectId,
    blockIndex,
    isEditMode,
    isMutating,
    onRemove
}: {
    stat: StatItem;
    index: number;
    projectId: string;
    blockIndex: number;
    isEditMode: boolean;
    isMutating: boolean;
    onRemove: (index: number) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: stat.label });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: isEditMode ? (isDragging ? 'grabbing' : 'grab') : 'auto',
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className={`${styles.statItem} ${isEditMode ? styles.statItemEditable : ""}`}
            {...(isEditMode ? attributes : {})}
            {...(isEditMode ? listeners : {})}
        >
            <span className={styles.statLabel}>{stat.label}</span>
            <div 
                onPointerDown={isEditMode ? (e) => e.stopPropagation() : undefined}
            >
                <EditableText
                    value={stat.value}
                    path={`blocks.${blockIndex}.data.${index}.value`}
                    projectId={projectId}
                    as="span"
                    className={styles.statValue}
                />
            </div>
            {isEditMode && (
                <button
                    className={styles.removeStatBtn}
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(index);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    disabled={isMutating}
                    title="Odebrat údaj"
                >
                    ✕
                </button>
            )}
        </div>
    );
}

export function StatsBar({ stats, projectId, blockIndex }: StatsBarProps) {
    const { isEditMode } = useEditMode();
    const router = useRouter();
    const { showConfirm } = useDialog();
    const { showToast } = useToast();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMutating, setIsMutating] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Robust optimistic state sync for StatsBar
    const serverHash = stats.map(s => s.label).join('|');
    const [lastSyncedHash, setLastSyncedHash] = useState(serverHash);
    const [itemsConfig, setItemsConfig] = useState(stats);
    
    useEffect(() => {
        const currentServerHash = stats.map(s => s.label).join('|');
        if (currentServerHash !== lastSyncedHash) {
            setItemsConfig(stats);
            setLastSyncedHash(currentServerHash);
        }
    }, [stats, lastSyncedHash]);

    const items = itemsConfig.map(s => s.label);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const existingLabels = itemsConfig.map(s => s.label);
    const availableProperties = PROJECT_PROPERTIES.filter(p => !existingLabels.includes(p.label));

    const handleAddStat = async (prop: typeof PROJECT_PROPERTIES[0]) => {
        if (isMutating) return;
        setIsMutating(true);
        setIsDropdownOpen(false);

        const newStats = [...itemsConfig, { label: prop.label, value: prop.defaultPlaceholder }];
        setItemsConfig(newStats); // Optimistic UI
        showToast("saving");

        try {
            const res = await fetch("/api/content", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    path: `blocks.${blockIndex}.data`,
                    value: newStats,
                }),
            });
            if (res.ok) {
                showToast("success");
                router.refresh();
            } else {
                showToast("error", "Nepodařilo se přidat údaj");
            }
        } catch (e) {
            console.error("Error adding stat:", e);
            showToast("error", "Nepodařilo se přidat údaj");
        } finally {
            setIsMutating(false);
        }
    };

    const handleRemoveStat = useCallback(async (indexToRemove: number) => {
        if (isMutating) return;

        showConfirm({
            title: "Opravdu chcete odebrat tento údaj?",
            onConfirm: async () => {
                setIsMutating(true);
                const newStats = itemsConfig.filter((_, i) => i !== indexToRemove);
                setItemsConfig(newStats); // Optimistic UI
                showToast("saving");

                try {
                    const res = await fetch("/api/content", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            projectId,
                            path: `blocks.${blockIndex}.data`,
                            value: newStats,
                        }),
                    });
                    if (res.ok) {
                        showToast("success");
                        router.refresh();
                    } else {
                        showToast("error", "Nepodařilo se odebrat údaj");
                    }
                } catch (e) {
                    console.error("Error removing stat:", e);
                    showToast("error", "Nepodařilo se odebrat údaj");
                } finally {
                    setIsMutating(false);
                }
            }
        });
    }, [isMutating, itemsConfig, projectId, blockIndex, router, showConfirm, showToast]);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        if (oldIndex === -1 || newIndex === -1) return;

        const newStats = arrayMove(itemsConfig, oldIndex, newIndex);
        setItemsConfig(newStats); // Optimistic UI
        showToast("saving");

        setIsMutating(true);
        try {
            const res = await fetch("/api/content", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    path: `blocks.${blockIndex}.data`,
                    value: newStats,
                }),
            });
            if (res.ok) {
                showToast("success");
                router.refresh();
            } else {
                showToast("error", "Nepodařilo se přerovnat údaje");
            }
        } catch (e) {
            console.error("Error reordering stats:", e);
            showToast("error", "Nepodařilo se přerovnat údaje");
        } finally {
            setIsMutating(false);
        }
    };

    return (
        <section className={styles.statsBar}>
            <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext 
                    items={items}
                    strategy={horizontalListSortingStrategy}
                >
                    {itemsConfig.map((stat, index) => (
                        <SortableStatItem
                            key={stat.label}
                            stat={stat}
                            index={index}
                            projectId={projectId}
                            blockIndex={blockIndex}
                            isEditMode={!!isEditMode}
                            isMutating={isMutating}
                            onRemove={handleRemoveStat}
                        />
                    ))}
                </SortableContext>
            </DndContext>

            {isEditMode && availableProperties.length > 0 && (
                <div className={styles.addStatWrapper} ref={dropdownRef}>
                    <button
                        className={styles.addStatBtn}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        disabled={isMutating}
                    >
                        ➕ Přidat údaj
                    </button>

                    {isDropdownOpen && (
                        <div className={styles.dropdownMenu}>
                            {availableProperties.map(prop => (
                                <button
                                    key={prop.id}
                                    className={styles.dropdownItem}
                                    onClick={() => handleAddStat(prop)}
                                >
                                    {prop.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
