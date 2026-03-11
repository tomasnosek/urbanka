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
        }

        revalidatePath('/', 'layout');

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Content PATCH error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
