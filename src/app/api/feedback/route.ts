/* =============================================
   URBANKA — Feedback API Route
   ============================================= */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { analyzeFeedback } from "@/lib/gemini";
import { sendFeedbackNotification } from "@/lib/email";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { projectId, name, email, message } = body;

        if (!projectId || !message?.trim()) {
            return NextResponse.json(
                { error: "Missing projectId or message" },
                { status: 400 }
            );
        }

        const category = await analyzeFeedback(message.trim());
        const supabase = await createServerSupabase();

        const { error } = await supabase.from("feedback").insert({
            project_id: projectId,
            name: name || null,
            email: email || null,
            message: message.trim(),
            category: category,
        });

        if (error) {
            console.error("Feedback insert error:", error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        // Fire-and-forget: send notification email to admin
        // Fetch project title for the email
        const { data: project } = await supabase
            .from("projects")
            .select("title")
            .eq("id", projectId)
            .single();

        sendFeedbackNotification({
            projectTitle: project?.title || "Neznámý projekt",
            name: name || null,
            email: email || null,
            message: message.trim(),
            category,
        }).catch((err) => console.error("Email notification failed:", err));

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Feedback error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
