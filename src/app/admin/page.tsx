import { createServerSupabase } from "@/lib/supabase-server";
import Link from "next/link";
import styles from "./admin.module.css";
import { Project } from "@/lib/types";

export const revalidate = 0; // Don't cache admin page

export default async function AdminDashboardPage() {
    const supabase = await createServerSupabase();

    // 1. Fetch counts
    const { count: munCount } = await supabase.from("municipalities").select("*", { count: "exact", head: true });
    const { count: projCount } = await supabase.from("projects").select("*", { count: "exact", head: true });
    const { count: unreadFeedback } = await supabase
        .from("feedback")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);

    // 2. Fetch recent projects
    const { data: recentProjects } = await supabase
        .from("projects")
        .select(`
            id,
            title,
            slug,
            status,
            updated_at,
            municipalities ( slug, name )
        `)
        .order("updated_at", { ascending: false })
        .limit(5);

    // 3. Fetch recent feedback
    const { data: recentFeedback } = await supabase
        .from("feedback")
        .select(`
            id,
            name,
            message,
            category,
            created_at,
            is_read,
            projects ( title )
        `)
        .order("created_at", { ascending: false })
        .limit(5);

    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <h1 className={styles.title}>Přehled</h1>
                <p className={styles.subtitle}>Vítejte v administraci systému Urbanka.</p>
            </header>

            <section className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Obce</span>
                    <span className={styles.statValue}>{munCount || 0}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Projekty celkem</span>
                    <span className={styles.statValue}>{projCount || 0}</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Nové zprávy (Feedback)</span>
                    <span className={styles.statValue} style={{ color: unreadFeedback ? "var(--color-sage)" : "inherit" }}>
                        {unreadFeedback || 0}
                    </span>
                </div>
            </section>

            <div className={styles.cols}>
                {/* Recent Projects */}
                <section>
                    <h2 className={styles.sectionTitle}>Nedávno upravené projekty</h2>
                    <div className={styles.list}>
                        {recentProjects && recentProjects.length > 0 ? (
                            recentProjects.map((p: any) => (
                                <Link key={p.id} href={`/${p.municipalities.slug}/${p.slug}`} className={styles.listItem}>
                                    <div className={styles.itemHeader}>
                                        <div className={styles.itemTitle}>{p.title}</div>
                                        <span className={`${styles.badge} ${p.status === 'published' ? styles.badgePublished : p.status === 'archived' ? styles.badgeArchived : styles.badgeDraft}`}>
                                            {p.status}
                                        </span>
                                    </div>
                                    <div className={styles.itemMeta}>
                                        Obec: {p.municipalities.name} • Upraveno: {new Date(p.updated_at).toLocaleDateString("cs-CZ")}
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <p className={styles.itemMeta}>Zatím žádné projekty.</p>
                        )}
                    </div>
                </section>

                {/* Recent Feedback */}
                <section>
                    <h2 className={styles.sectionTitle}>Poslední zpětná vazba</h2>
                    <div className={styles.list}>
                        {recentFeedback && recentFeedback.length > 0 ? (
                            recentFeedback.map((f: any) => (
                                <div key={f.id} className={styles.listItem} style={{ opacity: f.is_read ? 0.6 : 1 }}>
                                    <div className={styles.itemHeader}>
                                        <div className={styles.itemTitle}>{f.name || "Anonym"} - {f.category}</div>
                                        {!f.is_read && <span className={`${styles.badge} ${styles.badgeDraft}`}>Nové</span>}
                                    </div>
                                    <p style={{ fontSize: "var(--text-sm)", margin: "var(--space-2) 0" }}>
                                        {f.message.length > 100 ? f.message.substring(0, 100) + "..." : f.message}
                                    </p>
                                    <div className={styles.itemMeta}>
                                        Projekt: {f.projects?.title} • {new Date(f.created_at).toLocaleDateString("cs-CZ")}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className={styles.itemMeta}>Žádná zpětná vazba.</p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
