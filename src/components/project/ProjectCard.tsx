"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEditMode } from "@/components/editor/EditModeContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import styles from "./ProjectCard.module.css";
import type { DbProject } from "@/lib/database.types";

interface ProjectCardProps {
    project: DbProject;
    municipalitySlug: string;
}

export function ProjectCard({ project, municipalitySlug }: ProjectCardProps) {
    const { isEditMode } = useEditMode();
    const router = useRouter();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const heroBlock = project.content.blocks?.find((b: any) => b.type === "hero");
    const statsBlock = project.content.blocks?.find((b: any) => b.type === "stats");

    const imageUrl = heroBlock?.data?.imageUrl || "/images/black.png";
    const leadText = (heroBlock?.data?.lead || "").slice(0, 120);
    const mainStat = statsBlock?.data?.[1]?.value || "";

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        try {
            const res = await fetch(`/api/admin/projects/${project.id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setIsConfirmOpen(false);
                router.refresh();
            } else {
                console.error("Failed to delete project");
                alert("Nepodařilo se smazat projekt.");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleStatus = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (isUpdatingStatus) return;

        setIsUpdatingStatus(true);
        const newStatus = project.status === "published" ? "draft" : "published";

        try {
            const res = await fetch(`/api/admin/projects/${project.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                router.refresh();
            } else {
                console.error("Failed to change status");
                alert("Nepodařilo se změnit stav.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    return (
        <div className={styles.cardWrapper}>
            <Link href={`/${municipalitySlug}/${project.slug}`} className={styles.card}>
                <div className={styles.cardImage}>
                    <img src={imageUrl} alt={project.title} />
                </div>
                <div className={styles.cardBody}>
                    <span className={styles.cardStatus}>
                        <span
                            className={styles.cardStatusDot}
                            data-status={project.status}
                        />
                        {project.status === "published" ? "Publikováno" : "Návrh"}
                    </span>
                    <h2 className={styles.cardTitle}>{project.title}</h2>
                    <p className={styles.cardLead}>{leadText}…</p>
                    <div className={styles.cardMeta}>
                        <span>{mainStat}</span>
                    </div>
                </div>
            </Link>

            {/* Edit Mode Overlay Actions */}
            {isEditMode && (
                <div className={styles.editOverlay}>
                    <div className={styles.switchContainer} onClick={toggleStatus}>
                        <span className={styles.switchLabel} data-active={project.status === "draft"}>Draft</span>
                        <div className={styles.switchTrack} data-published={project.status === "published"}>
                            <div className={styles.switchThumb} data-published={project.status === "published"} />
                        </div>
                        <span className={styles.switchLabel} data-active={project.status === "published"}>Publikováno</span>
                    </div>

                    <button
                        className={styles.deleteButton}
                        onClick={handleDeleteClick}
                        title="Smazat projekt"
                    >
                        Smazat
                    </button>
                </div>
            )}

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title={`Opravdu chcete nenávratně smazat projekt "${project.title}"?`}
                onConfirm={confirmDelete}
                onCancel={() => setIsConfirmOpen(false)}
                cancelText="Ponechat"
            />
        </div>
    );
}
