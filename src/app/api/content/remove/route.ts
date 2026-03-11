import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { projectId, type } = body;

        if (!projectId || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const supabase = await createServerSupabase();

        // 1. Fetch current content
        const { data: project, error: fetchError } = await supabase
            .from("projects")
            .select("content")
            .eq("id", projectId)
            .single();

        if (fetchError || !project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const content = project.content;

        // 2. Remove appropriate item by index
        if (type === "block") {
            const { blockIndex } = body;
            if (blockIndex !== undefined && content.blocks && content.blocks[blockIndex]) {
                content.blocks.splice(blockIndex, 1);
            }
        } else if (type === "timelineRow") {
            const { blockIndex, index } = body;
            if (blockIndex !== undefined && index !== undefined && content.blocks[blockIndex] && content.blocks[blockIndex].data) {
                content.blocks[blockIndex].data.splice(index, 1);
            }
        } else if (type === "timelineImage") {
            const { blockIndex, timelineIndex, imageIndex } = body;
            if (
                blockIndex !== undefined &&
                timelineIndex !== undefined &&
                imageIndex !== undefined &&
                content.blocks[blockIndex] &&
                content.blocks[blockIndex].data[timelineIndex] &&
                content.blocks[blockIndex].data[timelineIndex].images
            ) {
                content.blocks[blockIndex].data[timelineIndex].images.splice(imageIndex, 1);
            }
        } else {
            return NextResponse.json({ error: "Unknown type" }, { status: 400 });
        }

        // 3. Save back to DB
        const { error: updateError } = await supabase
            .from("projects")
            .update({ content })
            .eq("id", projectId);

        if (updateError) {
            throw updateError;
        }

        revalidatePath('/', 'layout');

        return NextResponse.json({ success: true, content });
    } catch (error: any) {
        console.error("API /content/remove Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
