/* =============================================
   URBANKA — Municipalities Admin Page
   ============================================= */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createBrowserSupabase } from "@/lib/supabase";
import adminStyles from "../admin.module.css";
import styles from "./municipalities.module.css";

interface Municipality {
    id: string;
    name: string;
    slug: string;
    postal_code: string | null;
    emblem_url: string | null;
    created_at: string;
    project_count: number;
}

/* --- Shield SVG Placeholder --- */
function ShieldPlaceholder({ imageUrl, onClick }: { imageUrl: string | null; onClick: () => void }) {
    return (
        <div className={styles.shieldWrapper} onClick={onClick} title="Klikni pro nahrání znaku">
            <svg className={styles.shieldSvg} viewBox="0 0 80 96" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M4 4h72v52c0 20-16 32-36 36C20 88 4 76 4 56V4z"
                    fill={imageUrl ? "none" : "#f0f0f0"}
                    stroke="#d0d0d0"
                    strokeWidth="2"
                    strokeDasharray={imageUrl ? "0" : "6 3"}
                />
                {!imageUrl && (
                    <>
                        <text x="40" y="42" textAnchor="middle" fontSize="22" fill="#bbb">🏛</text>
                        <text x="40" y="64" textAnchor="middle" fontSize="8" fill="#bbb" fontFamily="sans-serif">Znak</text>
                    </>
                )}
            </svg>
            {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={imageUrl}
                    alt="Znak obce"
                    className={styles.shieldImage}
                />
            )}
        </div>
    );
}

export default function MunicipalitiesPage() {
    const supabase = createBrowserSupabase();
    const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
    const [loading, setLoading] = useState(true);

    // Add form
    const [newName, setNewName] = useState("");
    const [newPostalCode, setNewPostalCode] = useState("");
    const [newEmblemUrl, setNewEmblemUrl] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [uploading, setUploading] = useState(false);
    const addFileRef = useRef<HTMLInputElement>(null);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editPostalCode, setEditPostalCode] = useState("");
    const [editEmblemUrl, setEditEmblemUrl] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [editUploading, setEditUploading] = useState(false);
    const editFileRef = useRef<HTMLInputElement>(null);

    // Delete state
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchMunicipalities = useCallback(async () => {
        const { data } = await supabase
            .from("municipalities")
            .select(`id, name, slug, postal_code, emblem_url, created_at, projects ( count )`)
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

    /* --- Upload Emblem --- */
    async function uploadEmblem(file: File, target: "add" | "edit") {
        const setter = target === "add" ? setUploading : setEditUploading;
        const urlSetter = target === "add" ? setNewEmblemUrl : setEditEmblemUrl;
        setter(true);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/admin/municipalities/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (res.ok && data.url) {
                urlSetter(data.url);
            } else {
                alert("Chyba při nahrávání: " + (data.error || "Neznámá chyba"));
            }
        } catch {
            alert("Chyba při nahrávání znaku.");
        }
        setter(false);
    }

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
            postal_code: newPostalCode.trim() || null,
            emblem_url: newEmblemUrl || null,
        });

        if (error) {
            alert("Chyba: " + error.message);
        } else {
            setNewName("");
            setNewPostalCode("");
            setNewEmblemUrl(null);
            fetchMunicipalities();
        }
        setAdding(false);
    }

    /* --- Start Edit --- */
    function startEdit(m: Municipality) {
        setEditingId(m.id);
        setEditName(m.name);
        setEditPostalCode(m.postal_code || "");
        setEditEmblemUrl(m.emblem_url);
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
                postal_code: editPostalCode.trim() || null,
                emblem_url: editEmblemUrl || null,
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
                <form onSubmit={handleAdd}>
                    <div className={styles.addFormCard}>
                        {/* Shield Upload */}
                        <div className={styles.uploadArea}>
                            <ShieldPlaceholder
                                imageUrl={newEmblemUrl}
                                onClick={() => addFileRef.current?.click()}
                            />
                            <button
                                type="button"
                                onClick={() => addFileRef.current?.click()}
                                disabled={uploading}
                                className={styles.uploadBtn}
                            >
                                {uploading ? "Nahrávám..." : newEmblemUrl ? "Změnit znak" : "Nahrát znak"}
                            </button>
                            <input
                                ref={addFileRef}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) uploadEmblem(file, "add");
                                }}
                            />
                        </div>

                        {/* Text Fields */}
                        <div className={styles.addFields}>
                            <div>
                                <label className={styles.fieldLabel}>Název obce</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="např. Lužice"
                                    required
                                    className={styles.addInput}
                                />
                            </div>
                            <div>
                                <label className={styles.fieldLabel}>PSČ</label>
                                <input
                                    type="text"
                                    value={newPostalCode}
                                    onChange={(e) => setNewPostalCode(e.target.value)}
                                    placeholder="např. 696 18"
                                    className={styles.addInput}
                                    maxLength={10}
                                />
                            </div>
                            <button type="submit" disabled={adding || !newName.trim()} className={styles.addBtn}>
                                {adding ? "Přidávám..." : "Přidat obec"}
                            </button>
                        </div>
                    </div>
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
                                        <div className={styles.addFormCard}>
                                            {/* Shield Upload in edit mode */}
                                            <div className={styles.uploadArea}>
                                                <ShieldPlaceholder
                                                    imageUrl={editEmblemUrl}
                                                    onClick={() => editFileRef.current?.click()}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => editFileRef.current?.click()}
                                                    disabled={editUploading}
                                                    className={styles.uploadBtn}
                                                >
                                                    {editUploading ? "Nahrávám..." : editEmblemUrl ? "Změnit" : "Nahrát"}
                                                </button>
                                                <input
                                                    ref={editFileRef}
                                                    type="file"
                                                    accept="image/*"
                                                    hidden
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) uploadEmblem(file, "edit");
                                                    }}
                                                />
                                            </div>
                                            <div className={styles.addFields}>
                                                <div>
                                                    <label className={styles.fieldLabel}>Název obce</label>
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className={styles.addInput}
                                                        autoFocus
                                                    />
                                                </div>
                                                <div>
                                                    <label className={styles.fieldLabel}>PSČ</label>
                                                    <input
                                                        type="text"
                                                        value={editPostalCode}
                                                        onChange={(e) => setEditPostalCode(e.target.value)}
                                                        placeholder="např. 696 18"
                                                        className={styles.addInput}
                                                        maxLength={10}
                                                    />
                                                </div>
                                                <div className={styles.municipalityActions}>
                                                    <button
                                                        type="button"
                                                        onClick={handleSave}
                                                        disabled={saving || !editName.trim()}
                                                        className={styles.actionBtnSave}
                                                    >
                                                        {saving ? "Ukládám..." : "Uložit"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingId(null)}
                                                        className={styles.actionBtn}
                                                    >
                                                        Zrušit
                                                    </button>
                                                </div>
                                            </div>
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
                                                {m.postal_code && `PSČ: ${m.postal_code} • `}
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
