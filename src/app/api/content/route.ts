/* =============================================
   URBANKA — Content PATCH API Route
   Updates a specific JSONB path in project content
   ============================================= */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase-server";
import { JsonUpdateSchema } from "@/lib/validations";

/** Converts a Czech title to a base URL-safe slug */
function toBaseSlug(title: string): string {
    return title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/**
 * Generates a unique slug for a project within its municipality.
 * If `rekonstrukce-osvetleni` already exists, returns `rekonstrukce-osvetleni-2`, etc.
 * The first occurrence always gets the clean slug (no suffix).
 */
async function generateUniqueSlug(
    supabase: any,
    title: string,
    municipalityId: string,
    currentProjectId: string
): Promise<string> {
    const base = toBaseSlug(title);

    // Fetch all slugs in this municipality that start with the base slug
    const { data: existing } = await supabase
        .from("projects")
        .select("slug")
        .eq("municipality_id", municipalityId)
        .neq("id", currentProjectId)
        .ilike("slug", `${base}%`);

    const existingSlugs = new Set((existing ?? []).map((r: any) => r.slug));

    if (!existingSlugs.has(base)) return base;

    // Find the next available counter starting from 2
    let counter = 2;
    while (existingSlugs.has(`${base}-${counter}`)) {
        counter++;
    }
    return `${base}-${counter}`;
}

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request body
        const parseResult = JsonUpdateSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: "Invalid payload format", details: parseResult.error.format() },
                { status: 400 }
            );
        }

        const { projectId, path, value } = parseResult.data;

        const supabase = await createServerSupabase();

        // Fetch current project for revalidation + history snapshot
        const { data: projectData } = await supabase
            .from("projects")
            .select("slug, municipality_id, content, title")
            .eq("id", projectId)
            .single();

        // ── Content History Snapshot ────────────────────────────────────────
        // Save the current state before we overwrite anything.
        // The table must exist: see /supabase/migrations/add_content_history.sql
        if (projectData?.content) {
            await supabase
                .from("content_history")
                .insert({
                    project_id: projectId,
                    content: projectData.content,
                    changed_path: path,
                })
                .then(({ error }) => {
                    if (error) {
                        // Non-fatal: history write failure shouldn't block the update
                        console.warn("[content_history] Failed to write snapshot:", error.message);
                    }
                });
        }

        let titleUpdated = false;

        if (path === "root") {
            // Full content replacement
            const { error } = await supabase
                .from("projects")
                .update({ content: value })
                .eq("id", projectId);

            if (error) {
                console.error("Content root update error:", error);
                return NextResponse.json(
                    { error: error.message },
                    { status: 500 }
                );
            }
        } else if (path === "project.title") {
            // Direct DB column update — title is the single source of truth
            // Regenerate slug with dedup counter logic
            const { data: projectMeta } = await supabase
                .from("projects")
                .select("municipality_id")
                .eq("id", projectId)
                .single();

            const slug = projectMeta
                ? await generateUniqueSlug(supabase, value, projectMeta.municipality_id, projectId)
                : toBaseSlug(value);

            const { error } = await supabase
                .from("projects")
                .update({ title: value, slug })
                .eq("id", projectId);

            if (error) {
                console.error("Title column update error:", error);
                return NextResponse.json(
                    { error: error.message },
                    { status: 500 }
                );
            }
            titleUpdated = true;
        } else {
            // Generic JSONB content update
            const pathParts = path.split(".");

            const { error } = await supabase.rpc("update_project_content", {
                p_project_id: projectId,
                p_path: pathParts,
                p_value: value,
            });

            if (error) {
                console.error("Content update error:", error);
                return NextResponse.json(
                    { error: error.message },
                    { status: 500 }
                );
            }
        }

        // Revalidate caches
        if (projectData) {
            const { data: municipality } = await supabase
                .from("municipalities")
                .select("slug")
                .eq("id", projectData.municipality_id)
                .single();

            if (municipality) {
                revalidatePath(`/${municipality.slug}/${projectData.slug}`);
                // Title change affects project lists, next/prev links on sibling pages
                if (titleUpdated) {
                    revalidatePath(`/${municipality.slug}`, "layout");
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Content PATCH error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
