/* =============================================
   URBANKA — Email Notifications (Resend API)
   ============================================= */

interface FeedbackEmailData {
    projectTitle: string;
    name: string | null;
    email: string | null;
    message: string;
    category: string;
}

/**
 * Send a notification email when new feedback is submitted.
 * Uses Resend API via simple fetch (no npm package needed).
 * This function is fire-and-forget — it logs errors but doesn't throw.
 */
export async function sendFeedbackNotification(data: FeedbackEmailData) {
    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

    if (!apiKey || !adminEmail) {
        console.warn("Email notification skipped — RESEND_API_KEY or ADMIN_NOTIFICATION_EMAIL not set.");
        return;
    }

    const categoryLabels: Record<string, string> = {
        question: "💬 Dotaz",
        error: "⚠️ Chyba",
        spam: "🚫 Spam",
        toxic: "🔴 Toxické",
    };

    const categoryLabel = categoryLabels[data.category] || data.category;
    const senderName = data.name || "Anonym";
    const senderEmail = data.email ? `(${data.email})` : "";

    const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 0;">
            <div style="background: #2F3E46; color: #ffffff; padding: 24px 32px; border-radius: 4px 4px 0 0;">
                <h1 style="margin: 0; font-size: 18px; font-weight: 600;">Nová zpětná vazba</h1>
                <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.8;">Projekt: ${data.projectTitle}</p>
            </div>
            <div style="border: 1px solid #e0e0e0; border-top: none; padding: 24px 32px; border-radius: 0 0 4px 4px;">
                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 6px 0; color: #666; width: 100px;">Od:</td>
                        <td style="padding: 6px 0; font-weight: 500;">${senderName} ${senderEmail}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #666;">Kategorie:</td>
                        <td style="padding: 6px 0;">${categoryLabel}</td>
                    </tr>
                </table>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 16px 0;" />
                <div style="font-size: 15px; line-height: 1.6; color: #333; white-space: pre-wrap;">${data.message}</div>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 16px 0;" />
                <p style="font-size: 12px; color: #999; margin: 0;">
                    Toto je automatická notifikace ze systému Urbanka.
                </p>
            </div>
        </div>
    `;

    try {
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                from: "Urbanka <onboarding@resend.dev>",
                to: [adminEmail],
                subject: `[Urbanka] ${categoryLabel} — ${data.projectTitle}`,
                html: htmlBody,
            }),
        });

        if (!res.ok) {
            const errorData = await res.text();
            console.error("Resend API error:", res.status, errorData);
        }
    } catch (err) {
        console.error("Failed to send feedback notification email:", err);
    }
}
