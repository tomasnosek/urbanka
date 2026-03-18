import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

// Helper to access nested object properties via a string path "blocks.2.data.images"
function getNestedValue(obj: any, path: string) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

// Helper to set nested object properties
function setNestedValue(obj: any, path: string, value: any) {
    const parts = path.split('.');
    const last = parts.pop();
    if (!last) return false;
    
    const target = parts.reduce((acc, part) => {
        if (acc[part] === undefined) acc[part] = {};
        return acc[part];
    }, obj);
    
    target[last] = value;
    return true;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { projectId, path, oldIndex, newIndex } = body;

        if (!projectId || !path || oldIndex === undefined || newIndex === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const supabase = await createServerSupabase();

        // 1. Fetch current content + slugs for targeted revalidation
        const { data: project, error: fetchError } = await supabase
            .from("projects")
            .select("content, slug, municipality_id")
            .eq("id", projectId)
            .single();

        if (fetchError || !project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const content = project.content;

        // 2. Locate the array
        const targetArray = getNestedValue(content, path);

        if (!Array.isArray(targetArray)) {
            return NextResponse.json({ error: "Target path does not point to an array" }, { status: 400 });
        }

        if (oldIndex < 0 || oldIndex >= targetArray.length || newIndex < 0 || newIndex >= targetArray.length) {
            return NextResponse.json({ error: "Index out of bounds" }, { status: 400 });
        }

        // 3. Reorder the array elements
        const itemToMove = targetArray.splice(oldIndex, 1)[0];
        targetArray.splice(newIndex, 0, itemToMove);

        // Update the value back to the content object
        setNestedValue(content, path, targetArray);

        // 4. Save back to DB
        const { error: updateError } = await supabase
            .from("projects")
            .update({ content })
            .eq("id", projectId);

        if (updateError) {
            throw updateError;
        }

        // 5. Revalidate only the specific project page
        const { data: municipality } = await supabase
            .from("municipalities")
            .select("slug")
            .eq("id", project.municipality_id)
            .single();

        if (municipality) {
            revalidatePath(`/${municipality.slug}/${project.slug}`);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("API /content/reorder Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

