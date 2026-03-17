/* =============================================
   URBANKA — Municipality Admin API Route
   ============================================= */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

/* --- PUT: Update a municipality --- */
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { id, name, postal_code, emblem_url } = body;

        if (!id || !name?.trim()) {
            return NextResponse.json({ error: "ID a název jsou povinné." }, { status: 400 });
        }

        // Generate slug from name
        const slug = name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        const { error } = await supabase
            .from("municipalities")
            .update({ name: name.trim(), slug, postal_code: postal_code || null, emblem_url: emblem_url || null })
            .eq("id", id);

        if (error) {
            console.error("Municipality update error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Municipality PUT error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/* --- DELETE: Remove a municipality --- */
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID obce je povinné." }, { status: 400 });
        }

        // Check if municipality has projects
        const { count } = await supabase
            .from("projects")
            .select("*", { count: "exact", head: true })
            .eq("municipality_id", id);

        if (count && count > 0) {
            return NextResponse.json(
                { error: `Obec nelze smazat — má ${count} projekt${count === 1 ? "" : count < 5 ? "y" : "ů"}.` },
                { status: 409 }
            );
        }

        const { error } = await supabase.from("municipalities").delete().eq("id", id);

        if (error) {
            console.error("Municipality delete error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Municipality DELETE error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
