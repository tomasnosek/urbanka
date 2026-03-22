"use client";

import { useTransition } from "react";

export function StatusSelectors({
    project,
    updateStatusAction,
}: {
    project: {
        id: string;
        status: "draft" | "published" | "archived";
        public_status: "Plánovaný" | "Staví se" | "Dokončený";
    };
    updateStatusAction: (formData: FormData) => Promise<void>;
}) {
    const [isPending, startTransition] = useTransition();

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const formData = new FormData();
        formData.append("id", project.id);
        formData.append("type", "status");
        formData.append("value", e.target.value);
        startTransition(() => {
            updateStatusAction(formData);
        });
    };

    const handlePublicStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const formData = new FormData();
        formData.append("id", project.id);
        formData.append("type", "public_status");
        formData.append("value", e.target.value);
        startTransition(() => {
            updateStatusAction(formData);
        });
    };

    return (
        <div style={{ display: "flex", gap: "var(--space-2)", opacity: isPending ? 0.5 : 1 }}>
            <select
                value={project.status}
                onChange={handleStatusChange}
                disabled={isPending}
                style={{
                    padding: "2px 8px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    cursor: isPending ? "wait" : "pointer",
                    border: "none",
                    backgroundColor: project.status === "published" ? "#dcfce7" : project.status === "archived" ? "#f3f4f6" : "#fef3c7",
                    color: project.status === "published" ? "#166534" : project.status === "archived" ? "#374151" : "#92400e"
                }}
            >
                <option value="draft">Draft</option>
                <option value="published">Publikovaný</option>
                <option value="archived">Archivovaný</option>
            </select>

            <select
                value={project.public_status || "Plánovaný"}
                onChange={handlePublicStatusChange}
                disabled={isPending}
                style={{
                    padding: "2px 8px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    cursor: isPending ? "wait" : "pointer",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "white",
                    color: "var(--color-text)"
                }}
            >
                <option value="Plánovaný">Plánovaný</option>
                <option value="Staví se">Staví se</option>
                <option value="Dokončený">Dokončený</option>
            </select>
        </div>
    );
}
