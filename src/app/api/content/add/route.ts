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
            .select("content, slug, municipality_id")
            .eq("id", projectId)
            .single();

        if (fetchError || !project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const content = project.content;

        // 2. Append appropriate empty block
        if (!content.blocks) content.blocks = [];

        if (type === "contentBlockLeft" || type === "contentBlockRight") {
            content.blocks.push({
                id: crypto.randomUUID(),
                type: type,
                data: {
                    title: "Nový blok obsahu",
                    content: "Klikněte sem pro úpravu textu...",
                    imageUrl: "/images/black.png",
                    imagePosition: type === "contentBlockLeft" ? "left" : "right"
                }
            });
        } else if (type === "timelineBlock") {
            content.blocks.push({
                id: crypto.randomUUID(),
                type: "timeline",
                data: []
            });
        } else if (type === "heroBlock") {
            content.blocks.push({
                id: crypto.randomUUID(),
                type: "hero",
                data: {
                    title: "Nový nadpis",
                    lead: "Nový podnadpis",
                    imageUrl: "/images/black.png",
                    imageCaption: "Nový popisek"
                }
            });
        } else if (type === "statsBlock") {
            content.blocks.push({
                id: crypto.randomUUID(),
                type: "stats",
                data: [
                    { label: "Nová položka", value: "0" }
                ]
            });
        } else if (type === "timelineRow") {
            const { blockIndex } = body;
            if (blockIndex === undefined || !content.blocks[blockIndex] || content.blocks[blockIndex].type !== "timeline") {
                return NextResponse.json({ error: "Invalid block index or type for timelineRow addition" }, { status: 400 });
            }
            if (!content.blocks[blockIndex].data) content.blocks[blockIndex].data = [];
            content.blocks[blockIndex].data.unshift({
                id: crypto.randomUUID(),
                date: "Nový letopočet",
                title: "Nová událost",
                description: "Popis události...",
                images: []
            });
        } else if (type === "timelineImage") {
            const { blockIndex, timelineIndex } = body;
            if (blockIndex === undefined || timelineIndex === undefined || !content.blocks[blockIndex] || !content.blocks[blockIndex].data[timelineIndex]) {
                return NextResponse.json({ error: "Invalid indices" }, { status: 400 });
            }
            if (!content.blocks[blockIndex].data[timelineIndex].images) {
                content.blocks[blockIndex].data[timelineIndex].images = [];
            }
            content.blocks[blockIndex].data[timelineIndex].images.push({
                url: "/images/black.png",
                caption: "Nový obrázek"
            });
        } else if (type === "galleryBlock") {
            content.blocks.push({
                id: crypto.randomUUID(),
                type: "gallery",
                data: []
            });
        } else if (type === "galleryImage") {
            const { blockIndex } = body;
            if (blockIndex === undefined || !content.blocks[blockIndex]) {
                return NextResponse.json({ error: "Invalid gallery indices" }, { status: 400 });
            }
            if (!content.blocks[blockIndex].data) {
                content.blocks[blockIndex].data = [];
            }
            content.blocks[blockIndex].data.push({
                id: crypto.randomUUID(),
                url: "/images/black.png",
                caption: "Nový obrázek"
            });
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

        // Revalidate specific path if provided, otherwise fallback to lookup
        if (body.revalidatePath) {
            revalidatePath(body.revalidatePath);
        } else {
            const { data: municipality } = await supabase
                .from("municipalities")
                .select("slug")
                .eq("id", project.municipality_id)
                .single();

            if (municipality) {
                revalidatePath(`/${municipality.slug}/${project.slug}`);
            }
        }

        return NextResponse.json({ success: true, content });
    } catch (error: any) {
        console.error("API /content/add Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
