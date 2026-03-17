/* =============================================
   URBANKA — Emblem Upload API Route
   Saves municipality emblems to Supabase Storage
   ============================================= */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "Chybí soubor." }, { status: 400 });
        }

        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Pouze obrázky jsou povoleny." }, { status: 400 });
        }

        const supabase = await createServerSupabase();

        const ext = file.name.split(".").pop() ?? "png";
        const timestamp = Date.now();
        const filename = `emblems/${timestamp}.${ext}`;

        const bytes = await file.arrayBuffer();
        const { error: uploadError } = await supabase.storage
            .from("media")
            .upload(filename, Buffer.from(bytes), {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            console.error("Emblem upload error:", uploadError);
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        const { data: urlData } = supabase.storage
            .from("media")
            .getPublicUrl(filename);

        return NextResponse.json({ url: urlData.publicUrl });
    } catch (err) {
        console.error("Emblem upload error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
