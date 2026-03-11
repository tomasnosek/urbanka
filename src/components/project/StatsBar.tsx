"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { EditableText } from "@/components/editor/EditableText";
import { useEditMode } from "@/components/editor/EditModeContext";
import { PROJECT_PROPERTIES } from "@/lib/projectProperties";
import styles from "./StatsBar.module.css";
import type { StatItem } from "@/lib/types";

interface StatsBarProps {
    stats: StatItem[];
    projectId: string;
    blockIndex: number;
}

export function StatsBar({ stats, projectId, blockIndex }: StatsBarProps) {
    const { isEditMode } = useEditMode();
    const router = useRouter();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMutating, setIsMutating] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter properties not currently in stats
    const existingLabels = stats.map(s => s.label);
    const availableProperties = PROJECT_PROPERTIES.filter(p => !existingLabels.includes(p.label));

    const handleAddStat = async (prop: typeof PROJECT_PROPERTIES[0]) => {
        if (isMutating) return;
        setIsMutating(true);
        setIsDropdownOpen(false);

        const newStats = [...stats, { label: prop.label, value: prop.defaultPlaceholder }];

        try {
            await fetch("/api/content", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    path: `blocks.${blockIndex}.data`,
                    value: newStats,
                }),
            });
            router.refresh();
        } catch (e) {
            console.error("Error adding stat:", e);
        } finally {
            setIsMutating(false);
        }
    };

    const handleRemoveStat = async (indexToRemove: number) => {
        if (isMutating) return;
        if (!confirm("Opravdu chcete odebrat tento údaj?")) return;

        setIsMutating(true);
        const newStats = stats.filter((_, i) => i !== indexToRemove);

        try {
            await fetch("/api/content", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    path: `blocks.${blockIndex}.data`,
                    value: newStats,
                }),
            });
            router.refresh();
        } catch (e) {
            console.error("Error removing stat:", e);
        } finally {
            setIsMutating(false);
        }
    };

    return (
        <section className={styles.statsBar}>
            {stats.map((stat, index) => (
                <div key={`${stat.label}-${index}`} className={`${styles.statItem} ${isEditMode ? styles.statItemEditable : ""}`}>
                    <span className={styles.statLabel}>{stat.label}</span>
                    <EditableText
                        value={stat.value}
                        path={`blocks.${blockIndex}.data.${index}.value`}
                        projectId={projectId}
                        as="span"
                        className={styles.statValue}
                    />
                    {isEditMode && (
                        <button
                            className={styles.removeStatBtn}
                            onClick={() => handleRemoveStat(index)}
                            disabled={isMutating}
                            title="Odebrat údaj"
                        >
                            ✕
                        </button>
                    )}
                </div>
            ))}

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
