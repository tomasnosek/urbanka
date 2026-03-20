/* =============================================
   URBANKA — Content PATCH API Route
   Updates a specific JSONB path in project content
   ============================================= */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase-server";
import { JsonUpdateSchema } from "@/lib/validations";

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

        // Fetch current project to revalidate routes AND to inspect content for specific column syncs
        const { data: projectData } = await supabase
            .from("projects")
            .select("slug, municipality_id, content")
            .eq("id", projectId)
            .single();

        let titleUpdated = false;

        if (path === "root") {
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
        } else {
            // Build the JSONB path array for jsonb_set
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

            // Sync main database project 'title' column if the hero section's title was updated
            if (
                pathParts[0] === "blocks" &&
                pathParts[2] === "data" &&
                pathParts[3] === "title"
            ) {
                const blockIndex = parseInt(pathParts[1], 10);
                if (
                    !isNaN(blockIndex) &&
                    projectData?.content?.blocks?.[blockIndex]?.type === "hero"
                ) {
                    const { error: titleUpdateError } = await supabase
                        .from("projects")
                        .update({ title: value })
                        .eq("id", projectId);
                    
                    if (titleUpdateError) {
                        console.error("Title column update error:", titleUpdateError);
                    } else {
                        titleUpdated = true;
                    }
                }
            }
        }

        // Revalidate only the specific project page
        if (projectData) {
            const { data: municipality } = await supabase
                .from("municipalities")
                .select("slug")
                .eq("id", projectData.municipality_id)
                .single();

            if (municipality) {
                // Revalidate the specific project page explicitly
                revalidatePath(`/${municipality.slug}/${projectData.slug}`);
                // If title changed, revalidate the whole municipality layout to catch next/prev links on sibling pages
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
