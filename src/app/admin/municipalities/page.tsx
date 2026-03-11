import { createServerSupabase } from "@/lib/supabase-server";
import styles from "../admin.module.css";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export const revalidate = 0;

export default async function MunicipalitiesPage() {
    const supabase = await createServerSupabase();

    // Fetch municipalities
    const { data: municipalities } = await supabase
        .from("municipalities")
        .select(`
            id,
            name,
            slug,
            created_at,
            projects ( count )
        `)
        .order("name", { ascending: true });

    // Server action to add municipality
    async function createMunicipality(formData: FormData) {
        "use server";
        const name = formData.get("name") as string;
        const supabaseAdmin = await createServerSupabase();

        // Simple slug generation
        const slug = name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        await supabaseAdmin.from("municipalities").insert({ name, slug });
        revalidatePath("/admin/municipalities");
    }

    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <h1 className={styles.title}>Obce</h1>
                <p className={styles.subtitle}>Správa obcí v systému.</p>
            </header>

            <section className={styles.statCard} style={{ maxWidth: 600 }}>
                <h2 className={styles.sectionTitle} style={{ border: "none", padding: 0 }}>Přidat novou obec</h2>
                <form action={createMunicipality} style={{ display: "flex", gap: "var(--space-2)" }}>
                    <input
                        type="text"
                        name="name"
                        placeholder="Název obce (např. Lužice)"
                        required
                        style={{
                            flex: 1,
                            padding: "var(--space-2)",
                            border: "var(--border)",
                            borderRadius: "var(--radius)",
                            fontFamily: "var(--font-sans)",
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            backgroundColor: "var(--color-sage)",
                            color: "white",
                            border: "none",
                            padding: "var(--space-2) var(--space-4)",
                            borderRadius: "var(--radius)",
                            cursor: "pointer",
                            fontWeight: "var(--font-medium)",
                        }}
                    >
                        Přidat
                    </button>
                </form>
            </section>

            <section>
                <div className={styles.list}>
                    {municipalities && municipalities.length > 0 ? (
                        municipalities.map((m: any) => (
                            <div key={m.id} className={styles.listItem}>
                                <div className={styles.itemHeader}>
                                    <div className={styles.itemTitle}>{m.name}</div>
                                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                                        Slug: {m.slug}
                                    </span>
                                </div>
                                <div className={styles.itemMeta}>
                                    Počet projektů: {m.projects[0]?.count || 0} • Přidáno: {new Date(m.created_at).toLocaleDateString("cs-CZ")}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className={styles.itemMeta}>Zatím žádné obce.</p>
                    )}
                </div>
            </section>
        </div>
    );
}
