"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProjectCreationModal } from "@/components/project/ProjectCreationModal";
import styles from "./AddProjectSkeleton.module.css";
import pageStyles from "@/app/[municipality]/page.module.css";

interface AddProjectSkeletonProps {
    municipalityId: string;
    municipalitySlug: string;
}

export function AddProjectSkeleton({ municipalityId, municipalitySlug }: AddProjectSkeletonProps) {
    const { isAdmin } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!isAdmin) {
        return null; // Only show for admins
    }

    const handleCreateManual = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/projects/create-empty", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ municipality_id: municipalityId }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to create project");
            }

            const data = await res.json();
            // Redirect to the newly created project in edit mode using redirectUrl
            router.push(data.redirectUrl);
        } catch (error) {
            console.error("Error creating empty project:", error);
            setIsLoading(false);
        }
    };

    const handleGenerateFromFiles = () => {
        setIsModalOpen(true);
    };

    return (
        <>
            <div className={`${pageStyles.card} ${styles.skeletonCard}`}>
                <div className={styles.skeletonContent}>
                    <div className={styles.iconWrapper}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </div>
                    <h3 className={styles.title}>Přidat nový projekt</h3>
                    <p className={styles.description}>Založte nový investiční projekt pro tuto obec.</p>

                    <div className={styles.buttonGroup}>
                        <button
                            className={styles.buttonPrimary}
                            onClick={handleGenerateFromFiles}
                            disabled={isLoading}
                        >
                            Generovat ze souborů
                        </button>
                        <button
                            className={styles.buttonSecondary}
                            onClick={handleCreateManual}
                            disabled={isLoading}
                        >
                            {isLoading ? "Vytvářím..." : "Zadat ručně"}
                        </button>
                    </div>
                </div>
            </div>

            <ProjectCreationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                municipalityId={municipalityId}
            />
        </>
    );
}
