/* =============================================
   URBANKA — POST /api/subscribe
   Subscribes an email to project update notifications
   ============================================= */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { isRateLimited, getIp } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { projectId, email, honeypot } = body;

        // Honeypot
        if (honeypot) {
            return NextResponse.json({ success: true }); // Fake success
        }

        // Rate limit: 3 subscriptions per IP per minute
        const ip = getIp(request);
        if (isRateLimited(`subscribe:${ip}`, 3, 60_000)) {
            return NextResponse.json(
                { error: "Příliš mnoho požadavků. Zkuste to za chvíli." },
                { status: 429 }
            );
        }

        if (!projectId || !email || email.length > 254 || !email.includes("@")) {
            return NextResponse.json({ error: "Neplatný e-mail nebo projekt." }, { status: 400 });
        }

        const supabase = await createServerSupabase();

        const { error } = await supabase
            .from("project_subscriptions")
            .upsert({ project_id: projectId, email }, { onConflict: "project_id,email", ignoreDuplicates: true });

        if (error) {
            console.error("[subscribe] Error:", error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[subscribe] Unexpected error:", err);
        return NextResponse.json({ error: "Interní chyba serveru." }, { status: 500 });
    }
}
