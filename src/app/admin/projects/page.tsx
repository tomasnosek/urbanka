import { createServerSupabase } from "@/lib/supabase-server";
import styles from "../admin.module.css";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export const revalidate = 0;

export default async function ProjectsPage() {
    const supabase = await createServerSupabase();

    // 1. Fetch all projects
    const { data: projects } = await supabase
        .from("projects")
        .select(`
            id,
            title,
            slug,
            status,
            is_featured,
            created_at,
            municipalities ( id, name, slug )
        `)
        .order("created_at", { ascending: false });

    // Server action to toggle featured status
    async function toggleFeatured(formData: FormData) {
        "use server";
        const id = formData.get("id") as string;
        const currentStatus = formData.get("currentStatus") === "true";
        if (!id) return;

        const supabaseAdmin = await createServerSupabase();
        await supabaseAdmin.from("projects").update({ is_featured: !currentStatus }).eq("id", id);
        revalidatePath("/admin/projects");
        revalidatePath("/");
    }

    return (
        <div className={styles.dashboard}>
            <header className={styles.header} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "var(--space-4)" }}>
                <div>
                    <h1 className={styles.title}>Projekty</h1>
                    <p className={styles.subtitle}>Spravujte všechny investiční záměry.</p>
                </div>
                <Link
                    href="/admin/projects/new"
                    style={{
                        backgroundColor: "var(--color-sage)",
                        color: "white",
                        border: "none",
                        padding: "var(--space-3) var(--space-6)",
                        borderRadius: "var(--radius)",
                        textDecoration: "none",
                        fontWeight: "var(--font-medium)",
                        display: "inline-block"
                    }}
                >
                    + Založit nový projekt
                </Link>
            </header>

            <section>
                <div className={styles.list}>
                    {projects && projects.length > 0 ? (
                        projects.map((p: any) => (
                            <div key={p.id} className={styles.listItem} style={{ flexDirection: "row", alignItems: "center", gap: "var(--space-4)" }}>

                                {/* Featured Star Toggle */}
                                <form action={toggleFeatured} style={{ display: "flex", alignItems: "center" }}>
                                    <input type="hidden" name="id" value={p.id} />
                                    <input type="hidden" name="currentStatus" value={String(p.is_featured)} />
                                    <button
                                        type="submit"
                                        title={p.is_featured ? "Odebrat z Homepage" : "Zobrazit na Homepage"}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: "var(--text-xl)",
                                            padding: "var(--space-1)",
                                            color: p.is_featured ? "#eab308" : "var(--color-border)",
                                            transition: "color 0.2s"
                                        }}
                                    >
                                        ★
                                    </button>
                                </form>

                                <div style={{ flex: 1 }}>
                                    <div className={styles.itemHeader}>
                                        <div className={styles.itemTitle}>{p.title}</div>
                                        <span className={`${styles.badge} ${p.status === 'published' ? styles.badgePublished : p.status === 'archived' ? styles.badgeArchived : styles.badgeDraft}`}>
                                            {p.status}
                                        </span>
                                    </div>
                                    <div className={styles.itemMeta}>
                                        Obec: {p.municipalities?.name} • ID: {p.slug} • Vytvořeno: {new Date(p.created_at).toLocaleDateString("cs-CZ")}
                                    </div>
                                    <div style={{ marginTop: "var(--space-2)" }}>
                                        <Link href={`/${p.municipalities?.slug}/${p.slug}`} style={{ fontSize: "var(--text-sm)", color: "var(--color-sage)", fontWeight: "var(--font-medium)", textDecoration: "none" }}>
                                            Zobrazit a editovat obsah &rarr;
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className={styles.itemMeta}>Zatím žádné projekty.</p>
                    )}
                </div>
            </section>
        </div>
    );
}
