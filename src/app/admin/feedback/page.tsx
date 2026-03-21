import { createServerSupabase } from "@/lib/supabase-server";
import styles from "../admin.module.css";
import { revalidatePath } from "next/cache";

export const revalidate = 0;

export default async function FeedbackPage() {
    const supabase = await createServerSupabase();

    const { data: feedbackList } = await supabase
        .from("feedback")
        .select(`
            id,
            name,
            email,
            message,
            category,
            is_read,
            created_at,
            projects ( title, slug, municipalities ( slug ) )
        `)
        .order("created_at", { ascending: false });

    async function toggleReadStatus(formData: FormData) {
        "use server";
        const id = formData.get("id") as string;
        const currentStatus = formData.get("current_status") === "true";

        const supabaseAdmin = await createServerSupabase();
        await supabaseAdmin.from("feedback").update({ is_read: !currentStatus }).eq("id", id);

        revalidatePath("/admin/feedback");
        revalidatePath("/admin");
    }

    async function deleteFeedback(formData: FormData) {
        "use server";
        const id = formData.get("id") as string;

        const supabaseAdmin = await createServerSupabase();
        await supabaseAdmin.from("feedback").delete().eq("id", id);

        revalidatePath("/admin/feedback");
        revalidatePath("/admin");
    }

    return (
        <div className={styles.dashboard}>
            <header className={styles.header}>
                <h1 className={styles.title}>Zpětná vazba</h1>
                <p className={styles.subtitle}>Zprávy a podněty od občanů.</p>
            </header>

            <section>
                <div className={styles.list}>
                    {feedbackList && feedbackList.length > 0 ? (
                        feedbackList.map((f: any) => (
                            <div
                                key={f.id}
                                className={styles.listItem}
                                style={{
                                    opacity: f.is_read ? 0.7 : 1,
                                    borderLeft: f.is_read ? "var(--border)" : "4px solid var(--color-sage)",
                                }}
                            >
                                <div className={styles.itemHeader}>
                                    <div className={styles.itemTitle}>
                                        {f.name || "Anonym"}{f.email && ` (${f.email})`}
                                    </div>
                                    <div className={styles.badgeRow}>
                                        <span className={`${styles.badge} ${f.category === "spam" || f.category === "toxic" ? styles.badgeArchived : styles.badgeDraft}`}>
                                            {f.category}
                                        </span>
                                        {!f.is_read && (
                                            <span className={`${styles.badge} ${styles.badgePublished}`}>Nové</span>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.feedbackMessage}>
                                    {f.message}
                                </div>

                                <div className={styles.itemActions}>
                                    <span className={styles.itemMeta}>
                                        Projekt: <strong>{f.projects?.title}</strong> • {new Date(f.created_at).toLocaleString("cs-CZ")}
                                    </span>
                                    <div className={styles.actionButtons}>
                                        <form action={toggleReadStatus}>
                                            <input type="hidden" name="id" value={f.id} />
                                            <input type="hidden" name="current_status" value={f.is_read.toString()} />
                                            <button type="submit" className={styles.actionBtnSecondary}>
                                                {f.is_read ? "Označit jako nepřečtené" : "Označit jako přečtené"}
                                            </button>
                                        </form>
                                        <form action={deleteFeedback}>
                                            <input type="hidden" name="id" value={f.id} />
                                            <button type="submit" className={styles.actionBtnDanger}>
                                                Smazat
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className={styles.itemMeta}>Zatím žádná zpětná vazba.</p>
                    )}
                </div>
            </section>
        </div>
    );
}
