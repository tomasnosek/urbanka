"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./ProjectCreationModal.module.css";

interface ProjectCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    municipalityId: string;
}

interface FileEntry {
    id: string;
    file: File;
    comment: string;
}

export function ProjectCreationModal({ isOpen, onClose, municipalityId }: ProjectCreationModalProps) {
    const [files, setFiles] = useState<FileEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map((file) => ({
                id: Math.random().toString(36).substring(7),
                file,
                comment: "",
            }));
            setFiles((prev) => [...prev, ...newFiles]);
        }
    };

    const removeFile = (idToRemove: string) => {
        setFiles(files.filter(f => f.id !== idToRemove));
    };

    const updateComment = (idToUpdate: string, newComment: string) => {
        setFiles(files.map(f => f.id === idToUpdate ? { ...f, comment: newComment } : f));
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files) {
            const newFiles = Array.from(e.dataTransfer.files).map((file) => ({
                id: Math.random().toString(36).substring(7),
                file,
                comment: "",
            }));
            setFiles((prev) => [...prev, ...newFiles]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleSubmit = async () => {
        if (files.length === 0) return;
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("municipalityId", municipalityId);

            files.forEach((fileEntry, index) => {
                formData.append(`file_${index}`, fileEntry.file);
                formData.append(`comment_${index}`, fileEntry.comment);
            });

            const res = await fetch("/api/admin/projects/create-from-files", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Chyba při extrakci dat");

            onClose();
            router.push(data.redirectUrl);
        } catch (error: any) {
            console.error(error);
            alert("Chyba: " + error.message);
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Vytvořit ze souborů</h2>
                    <button className={styles.closeButton} onClick={onClose} disabled={isLoading}>×</button>
                </div>

                <div className={styles.body}>
                    <div
                        className={styles.dropzone}
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.txt"
                        />
                        <div className={styles.dropzoneIcon}>📁</div>
                        <p className={styles.dropzoneText}>
                            Klikněte nebo přetáhněte soubory sem
                        </p>
                        <p className={styles.dropzoneSubtext}>
                            Podporováno: PDF, DOC, TXT. Data se použijí pouze pro počáteční extrakci a poté se smažou.
                        </p>
                    </div>

                    {files.length > 0 && (
                        <div className={styles.fileList}>
                            <h3 className={styles.fileListTitle}>Vybrané soubory</h3>
                            {files.map(fileEntry => (
                                <div key={fileEntry.id} className={styles.fileItem}>
                                    <div className={styles.fileItemTop}>
                                        <span className={styles.fileName}>{fileEntry.file.name}</span>
                                        <button
                                            className={styles.removeBtn}
                                            onClick={() => removeFile(fileEntry.id)}
                                            disabled={isLoading}
                                        >
                                            Odstranit
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        className={styles.commentInput}
                                        placeholder="Zadání pro AI k tomuto souboru (volitelné)..."
                                        value={fileEntry.comment}
                                        onChange={(e) => updateComment(fileEntry.id, e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelButton} onClick={onClose} disabled={isLoading}>
                        Zrušit
                    </button>
                    <button
                        className={styles.submitButton}
                        onClick={handleSubmit}
                        disabled={isLoading || files.length === 0}
                    >
                        {isLoading ? "⌛ Analyzuji a vytvářím..." : "Analyzovat a vytvořit projekt"}
                    </button>
                </div>
            </div>
        </div>
    );
}
