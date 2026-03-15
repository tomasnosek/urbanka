/* =============================================
   URBANKA — Municipalities Admin Page
   ============================================= */

"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserSupabase } from "@/lib/supabase";
import adminStyles from "../admin.module.css";
import styles from "./municipalities.module.css";

interface Municipality {
    id: string;
    name: string;
    slug: string;
    emblem_url: string | null;
    created_at: string;
    project_count: number;
}

export default function MunicipalitiesPage() {
    const supabase = createBrowserSupabase();
    const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
    const [loading, setLoading] = useState(true);

    // Add form
    const [newName, setNewName] = useState("");
    const [newEmblemUrl, setNewEmblemUrl] = useState("");
    const [adding, setAdding] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editEmblemUrl, setEditEmblemUrl] = useState("");
    const [saving, setSaving] = useState(false);

    // Delete state
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchMunicipalities = useCallback(async () => {
        const { data } = await supabase
            .from("municipalities")
            .select(`id, name, slug, emblem_url, created_at, projects ( count )`)
            .order("name", { ascending: true });

        if (data) {
            setMunicipalities(
                data.map((m: any) => ({
                    ...m,
                    project_count: m.projects?.[0]?.count || 0,
                }))
            );
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchMunicipalities();
    }, [fetchMunicipalities]);

    /* --- Add Municipality --- */
    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim()) return;
        setAdding(true);

        const slug = newName
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        const { error } = await supabase.from("municipalities").insert({
            name: newName.trim(),
            slug,
            emblem_url: newEmblemUrl.trim() || null,
        });

        if (error) {
            alert("Chyba: " + error.message);
        } else {
            setNewName("");
            setNewEmblemUrl("");
            fetchMunicipalities();
        }
        setAdding(false);
    }

    /* --- Start Edit --- */
    function startEdit(m: Municipality) {
        setEditingId(m.id);
        setEditName(m.name);
        setEditEmblemUrl(m.emblem_url || "");
    }

    /* --- Save Edit --- */
    async function handleSave() {
        if (!editingId || !editName.trim()) return;
        setSaving(true);

        const res = await fetch("/api/admin/municipalities", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: editingId,
                name: editName.trim(),
                emblem_url: editEmblemUrl.trim() || null,
            }),
        });

        if (!res.ok) {
            const data = await res.json();
            alert("Chyba: " + (data.error || "Neznámá chyba"));
        } else {
            setEditingId(null);
            fetchMunicipalities();
        }
        setSaving(false);
    }

    /* --- Delete Municipality --- */
    async function handleDelete(id: string) {
        if (!confirm("Opravdu chcete smazat tuto obec?")) return;
        setDeletingId(id);

        const res = await fetch(`/api/admin/municipalities?id=${id}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            const data = await res.json();
            alert(data.error || "Chyba při mazání.");
        } else {
            fetchMunicipalities();
        }
        setDeletingId(null);
    }

    return (
        <div className={adminStyles.dashboard}>
            <header className={adminStyles.header}>
                <h1 className={adminStyles.title}>Obce</h1>
                <p className={adminStyles.subtitle}>Správa obcí v systému — přidávání, editace a mazání.</p>
            </header>

            {/* --- Add Form --- */}
            <section className={adminStyles.statCard} style={{ maxWidth: 700 }}>
                <h2 className={adminStyles.sectionTitle} style={{ border: "none", padding: 0 }}>
                    Přidat novou obec
                </h2>
                <form onSubmit={handleAdd} className={styles.addForm}>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Název obce (např. Lužice)"
                        required
                        className={styles.addInput}
                    />
                    <input
                        type="url"
                        value={newEmblemUrl}
                        onChange={(e) => setNewEmblemUrl(e.target.value)}
                        placeholder="URL znaku (volitelné)"
                        className={styles.addInput}
                    />
                    <button type="submit" disabled={adding || !newName.trim()} className={styles.addBtn}>
                        {adding ? "Přidávám..." : "Přidat"}
                    </button>
                </form>
            </section>

            {/* --- List --- */}
            <section>
                <div className={adminStyles.list}>
                    {loading ? (
                        <p className={adminStyles.itemMeta}>Načítám...</p>
                    ) : municipalities.length === 0 ? (
                        <p className={adminStyles.itemMeta}>Zatím žádné obce.</p>
                    ) : (
                        municipalities.map((m) => (
                            <div key={m.id} className={adminStyles.listItem}>
                                {editingId === m.id ? (
                                    /* --- Edit Mode --- */
                                    <div className={styles.editForm}>
                                        <div className={styles.editRow}>
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                placeholder="Název obce"
                                                className={styles.editInput}
                                                autoFocus
                                            />
                                        </div>
                                        <div className={styles.editRow}>
                                            <input
                                                type="url"
                                                value={editEmblemUrl}
                                                onChange={(e) => setEditEmblemUrl(e.target.value)}
                                                placeholder="URL znaku (volitelné)"
                                                className={styles.editInput}
                                            />
                                            {editEmblemUrl && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={editEmblemUrl}
                                                    alt="Náhled"
                                                    className={styles.emblemPreview}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = "none";
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <div className={styles.municipalityActions}>
                                            <button
                                                onClick={handleSave}
                                                disabled={saving || !editName.trim()}
                                                className={styles.actionBtnSave}
                                            >
                                                {saving ? "Ukládám..." : "Uložit"}
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className={styles.actionBtn}
                                            >
                                                Zrušit
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* --- View Mode --- */
                                    <div className={styles.municipalityRow}>
                                        {m.emblem_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={m.emblem_url}
                                                alt={`Znak ${m.name}`}
                                                className={styles.emblemPreview}
                                            />
                                        ) : (
                                            <div className={styles.emblemPlaceholder}>🏛</div>
                                        )}
                                        <div className={styles.municipalityInfo}>
                                            <div className={adminStyles.itemHeader}>
                                                <div className={adminStyles.itemTitle}>{m.name}</div>
                                            </div>
                                            <div className={adminStyles.itemMeta}>
                                                Slug: {m.slug} • Projektů: {m.project_count} • Přidáno:{" "}
                                                {new Date(m.created_at).toLocaleDateString("cs-CZ")}
                                            </div>
                                        </div>
                                        <div className={styles.municipalityActions}>
                                            <button onClick={() => startEdit(m)} className={styles.actionBtn}>
                                                Upravit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(m.id)}
                                                disabled={deletingId === m.id}
                                                className={styles.actionBtnDanger}
                                            >
                                                {deletingId === m.id ? "Mažu..." : "Smazat"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
