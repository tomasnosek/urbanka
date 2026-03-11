import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase-server";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        if (!id || !status) {
            return NextResponse.json(
                { error: "Project ID and new status are required" },
                { status: 400 }
            );
        }

        const supabase = await createServerSupabase();

        const { error } = await supabase
            .from("projects")
            .update({ status })
            .eq("id", id);

        if (error) {
            console.error("Update project status error:", error);
            return NextResponse.json(
                { error: "Failed to update project status" },
                { status: 500 }
            );
        }

        revalidatePath('/', 'layout');

        return NextResponse.json({ success: true, status });
    } catch (error) {
        console.error("Update project status error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
