import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase-server";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { municipality_id } = body;

        if (!id || !municipality_id) {
            return NextResponse.json(
                { error: "Project ID and municipality_id are required" },
                { status: 400 }
            );
        }

        const supabase = await createServerSupabase();

        const { error } = await supabase
            .from("projects")
            .update({ municipality_id })
            .eq("id", id);

        if (error) {
            console.error("Update project municipality error:", error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        revalidatePath("/", "layout");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update project error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { error: "Project ID is required" },
                { status: 400 }
            );
        }

        const supabase = await createServerSupabase();

        const { error } = await supabase
            .from("projects")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Delete project error:", error);
            return NextResponse.json(
                { error: "Failed to delete project" },
                { status: 500 }
            );
        }

        revalidatePath('/', 'layout');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete project error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

