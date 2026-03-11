"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../admin.module.css";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase";

export default function NewProjectPage() {
    const router = useRouter();
    const supabase = createBrowserSupabase();

    const [municipalities, setMunicipalities] = useState<any[]>([]);
    const [selectedMunicipalityId, setSelectedMunicipalityId] = useState("");

    const [isCreatingBlank, setIsCreatingBlank] = useState(false);

    // Fetch municipalities on mount
    useState(() => {
        async function loadMunicipalities() {
            const { data } = await supabase.from("municipalities").select("id, name").order("name");
            if (data) setMunicipalities(data);
        }
        loadMunicipalities();
    });

    // Handler for creating a manual blank project
    async function handleCreateBlank() {
        if (!selectedMunicipalityId) {
            alert("Nejprve vyberte obec pro nový projekt.");
            return;
        }

        setIsCreatingBlank(true);
        try {
            const res = await fetch("/api/admin/projects/create-empty", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ municipality_id: selectedMunicipalityId }),
            });

            const data = await res.json();
            if (res.ok && data.redirectUrl) {
                router.push(data.redirectUrl);
            } else {
                alert(data.error || "Chyba při zakládání projektu");
                setIsCreatingBlank(false);
            }
        } catch (error) {
            console.error(error);
            alert("Došlo k chybě při komunikaci se serverem.");
            setIsCreatingBlank(false);
        }
    }

    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <div>
                    <Link href="/admin/projects" style={{ textDecoration: "none", color: "var(--color-sage)", fontSize: "var(--text-sm)", fontWeight: "var(--font-medium)", marginBottom: "var(--space-2)", display: "inline-block" }}>
                        &larr; Zpět na projekty
                    </Link>
                    <h1 className={styles.title}>Založit nový projekt</h1>
                    <p className={styles.subtitle}>Vyberte způsob, jakým chcete projekt založit.</p>
                </div>
            </header>

            <div style={{ marginBottom: "var(--space-8)" }}>
                <label style={{ display: "block", fontSize: "var(--text-base)", fontWeight: "var(--font-medium)", marginBottom: "var(--space-2)", color: "var(--color-text)" }}>
                    1. Ke které obci projekt patří?
                </label>
                <select
                    value={selectedMunicipalityId}
                    onChange={(e) => setSelectedMunicipalityId(e.target.value)}
                    style={{
                        width: "100%",
                        maxWidth: "400px",
                        padding: "var(--space-3)",
                        border: "var(--border)",
                        borderRadius: "var(--radius)",
                        fontFamily: "var(--font-sans)",
                        backgroundColor: "var(--color-surface)",
                        fontSize: "var(--text-base)"
                    }}
                >
                    <option value="">-- Vyberte obec ze seznamu --</option>
                    {municipalities.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-8)", alignItems: "stretch" }}>

                {/* SCENARIO B: Blank Manual Project */}
                <section className={styles.statCard} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    <h2 className={styles.sectionTitle} style={{ border: "none", padding: 0, marginBottom: "var(--space-2)" }}>Manuální zadání</h2>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-base)", lineHeight: "1.5", marginBottom: "var(--space-6)", flex: 1 }}>
                        Založí prázdný projekt se základní strukturou bloků (Hero sekce, Statistiky, Slovo starosty, Timeline). Po kliknutí budete ihned přesměrováni do editoru, kde obsah doplníte sami.
                    </p>
                    <button
                        onClick={handleCreateBlank}
                        disabled={isCreatingBlank || !selectedMunicipalityId}
                        style={{
                            backgroundColor: "var(--color-sage)",
                            color: "white",
                            border: "none",
                            padding: "var(--space-3) var(--space-6)",
                            borderRadius: "var(--radius)",
                            cursor: (!selectedMunicipalityId || isCreatingBlank) ? "not-allowed" : "pointer",
                            fontWeight: "var(--font-medium)",
                            fontSize: "var(--text-base)",
                            width: "100%",
                            opacity: (!selectedMunicipalityId || isCreatingBlank) ? 0.6 : 1,
                            transition: "opacity 0.2s"
                        }}
                    >
                        {isCreatingBlank ? "Zakládám..." : "Vytvořit prázdný projekt"}
                    </button>
                    {!selectedMunicipalityId && (
                        <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginTop: "var(--space-2)", textAlign: "center" }}>
                            Nejprve vyberte obec výše
                        </div>
                    )}
                </section>

                {/* SCENARIO A: AI Extraction Box (Placeholder for next sub-task) */}
                <section className={styles.statCard} style={{ display: "flex", flexDirection: "column", height: "100%", opacity: 0.5, pointerEvents: "none" }}>
                    <h2 className={styles.sectionTitle} style={{ border: "none", padding: 0, marginBottom: "var(--space-2)" }}>Extrahovat pomocí AI</h2>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-base)", lineHeight: "1.5", marginBottom: "var(--space-6)", flex: 1 }}>
                        Nahrajte PDF dokumenty (smlouvy, zprávy) a AI automaticky sestaví strukturu projektu a předvyplní obsah.
                    </p>
                    <div style={{
                        border: "2px dashed var(--color-border)",
                        borderRadius: "var(--radius)",
                        padding: "var(--space-10)",
                        textAlign: "center",
                        backgroundColor: "var(--color-bg)",
                        color: "var(--color-text-muted)",
                        fontWeight: "var(--font-medium)"
                    }}>
                        Tato funkce bude zpřístupněna v dalším kroku.
                    </div>
                </section>

            </div>
        </div>
    );
}
