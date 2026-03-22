import { createServerSupabase } from "@/lib/supabase-server";
import styles from "../admin.module.css";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import MunicipalitySelector from "./MunicipalitySelector";
import { StatusSelectors } from "./StatusSelectors";
import { DeleteProjectButton } from "./DeleteProjectButton";

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
            public_status,
            is_featured,
            municipality_id,
            created_at,
            municipalities ( id, name, slug )
        `)
        .order("created_at", { ascending: false });

    // Fetch all municipalities for the selector
    const { data: allMunicipalities } = await supabase
        .from("municipalities")
        .select("id, name, slug")
        .order("name", { ascending: true });

    // Server action to toggle featured status
    async function toggleFeatured(formData: FormData) {
        "use server";
        const id = formData.get("id") as string;
        const currentStatus = formData.get("currentStatus") === "true";
        if (!id) return;

        const supabaseAdmin = await createServerSupabase();
        await supabaseAdmin.from("projects").update({ is_featured: !currentStatus }).eq("id", id);
        revalidatePath("/admin/projects");
        revalidatePath("/", "layout");
    }

    async function updateStatus(formData: FormData) {
        "use server";
        const id = formData.get("id") as string;
        const type = formData.get("type") as "status" | "public_status";
        const value = formData.get("value") as string;
        if (!id || !type || !value) return;

        const supabaseAdmin = await createServerSupabase();
        await supabaseAdmin.from("projects").update({ [type]: value, updated_at: new Date().toISOString() }).eq("id", id);
        revalidatePath("/admin/projects");
        revalidatePath("/", "layout");
    }

    async function deleteProject(formData: FormData) {
        "use server";
        const id = formData.get("id") as string;
        if (!id) return;
        const supabaseAdmin = await createServerSupabase();
        await supabaseAdmin.from("projects").delete().eq("id", id);
        revalidatePath("/admin/projects");
        revalidatePath("/", "layout");
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
                                        <StatusSelectors project={p} updateStatusAction={updateStatus} />
                                    </div>
                                    <div className={styles.itemMeta}>
                                        Obec:{" "}
                                        <MunicipalitySelector
                                            projectId={p.id}
                                            currentMunicipalityId={p.municipality_id}
                                            municipalities={allMunicipalities || []}
                                        />
                                        {" "}• ID: {p.slug} • Vytvořeno: {new Date(p.created_at).toLocaleDateString("cs-CZ")}
                                    </div>
                                    <div style={{ marginTop: "var(--space-2)", display: "flex", gap: "var(--space-2)" }}>
                                        <Link href={`/${p.municipalities?.slug}/${p.slug}?edit=true`} className={styles.btnSecondary} style={{ fontSize: "var(--text-sm)", padding: "var(--space-1) var(--space-3)", display: "inline-block", textDecoration: "none" }}>
                                            Zobrazit a editovat obsah &rarr;
                                        </Link>
                                        <form action={deleteProject}>
                                            <input type="hidden" name="id" value={p.id} />
                                            <DeleteProjectButton />
                                        </form>
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
