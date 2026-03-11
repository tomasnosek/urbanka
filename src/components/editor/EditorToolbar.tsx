/* =============================================
   URBANKA — Editor Toolbar (admin floating bar)
   ============================================= */

"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useEditMode } from "@/components/editor/EditModeContext";
import { ProjectCreationModal } from "@/components/project/ProjectCreationModal";
import styles from "./Editor.module.css";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface EditorToolbarProps {
    projectId?: string;
    municipalityId?: string;
    municipalitySlug?: string;
}

export function EditorToolbar({ projectId, municipalityId, municipalitySlug }: EditorToolbarProps) {
    const { isAdmin, logout } = useAuth();
    const { isEditMode, toggleEditMode } = useEditMode();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const handleCreateManual = async () => {
        if (!municipalityId || !municipalitySlug) return;
        setIsCreating(true);
        setIsDropdownOpen(false);
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
            router.push(data.redirectUrl);
        } catch (error) {
            console.error("Error creating empty project:", error);
            alert("Chyba při zakládání projektu.");
            setIsCreating(false);
        }
    };

    const handleGenerateFromFiles = () => {
        setIsDropdownOpen(false);
        // TODO: Open modal
        console.log("Open AI generation modal");
    };

    if (!isAdmin) return null;

    return (
        <>
            <div className={styles.toolbar}>
                <span className={styles.toolbarLabel}>Admin</span>

                {/* Render dropdown ONLY in municipality context, not in project context */}
                {!projectId && municipalityId && (
                    <div style={{ position: "relative" }}>
                        <button
                            className={styles.toolbarButton}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            disabled={isCreating}
                        >
                            {isCreating ? "⌛ Vytvářím..." : "+ Přidat nový projekt"}
                        </button>
                        {isDropdownOpen && (
                            <div className={styles.dropdownMenu}>
                                <button className={styles.dropdownItem} onClick={() => {
                                    setIsDropdownOpen(false);
                                    setIsModalOpen(true);
                                }}>
                                    Generovat ze souborů
                                </button>
                                <button className={styles.dropdownItem} onClick={handleCreateManual}>
                                    Zadat ručně
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Edit mode toggle ONLY in project context */}
                {projectId && (
                    <button
                        className={`${styles.toolbarButton} ${isEditMode ? styles.toolbarButtonActive : ""}`}
                        onClick={toggleEditMode}
                    >
                        {isEditMode ? "✏️ Editace ZAP" : "✏️ Editace"}
                    </button>
                )}

                <button
                    className={styles.toolbarButton}
                    onClick={logout}
                >
                    Odhlásit
                </button>
            </div>

            {!projectId && municipalityId && (
                <ProjectCreationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    municipalityId={municipalityId}
                />
            )}
        </>
    );
}
