/* =============================================
   URBANKA — Municipality Selector (Client Component)
   Inline dropdown to reassign a project to a different municipality.
   ============================================= */

"use client";

import { useState } from "react";

interface MunicipalitySelectorProps {
    projectId: string;
    currentMunicipalityId: string;
    municipalities: { id: string; name: string; slug: string }[];
}

export default function MunicipalitySelector({
    projectId,
    currentMunicipalityId,
    municipalities,
}: MunicipalitySelectorProps) {
    const [value, setValue] = useState(currentMunicipalityId);
    const [saving, setSaving] = useState(false);

    async function handleChange(newId: string) {
        if (newId === value) return;
        setSaving(true);

        const res = await fetch(`/api/admin/projects/${projectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ municipality_id: newId }),
        });

        if (res.ok) {
            setValue(newId);
            // Reload to reflect new slug-based URLs
            window.location.reload();
        } else {
            const data = await res.json();
            alert("Chyba: " + (data.error || "Neznámá chyba"));
        }
        setSaving(false);
    }

    return (
        <select
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            disabled={saving}
            style={{
                padding: "2px 6px",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius)",
                fontSize: "var(--text-sm)",
                fontFamily: "var(--font-sans)",
                color: "var(--color-text-secondary)",
                backgroundColor: "var(--color-surface)",
                cursor: saving ? "wait" : "pointer",
                opacity: saving ? 0.6 : 1,
                maxWidth: 160,
            }}
        >
            {municipalities.map((m) => (
                <option key={m.id} value={m.id}>
                    {m.name}
                </option>
            ))}
        </select>
    );
}
