/* =============================================
   URBANKA — Image Upload API Route
   Saves to Supabase Storage
   ============================================= */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const projectId = formData.get("projectId") as string;
        const path = formData.get("path") as string;
        const pathToRevalidate = formData.get("revalidatePath") as string | null;

        if (!file || !projectId || !path) {
            return NextResponse.json(
                { error: "Missing file, projectId, or path" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "Only image files are allowed" },
                { status: 400 }
            );
        }

        const supabase = await createServerSupabase();

        // Use the extension matching the incoming file type if possible
        const isWebp = file.type === "image/webp";
        const fallbackExt = file.name.split(".").pop() ?? "jpg";
        const ext = isWebp ? "webp" : fallbackExt;

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${projectId}/${timestamp}.${ext}`;

        // Upload to Supabase Storage
        const bytes = await file.arrayBuffer();
        const { error: uploadError } = await supabase.storage
            .from("media")
            .upload(filename, Buffer.from(bytes), {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            console.error("Storage upload error:", uploadError);
            return NextResponse.json(
                { error: uploadError.message },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from("media")
            .getPublicUrl(filename);

        const url = urlData.publicUrl;

        // Update JSONB content with new URL
        const pathParts = path.split(".");

        const { error: dbError } = await supabase.rpc(
            "update_project_content",
            {
                p_project_id: projectId,
                p_path: pathParts,
                p_value: url,
            }
        );

        if (dbError) {
            console.error("DB update error:", dbError);
            return NextResponse.json(
                { error: dbError.message },
                { status: 500 }
            );
        }

        if (pathToRevalidate) {
            revalidatePath(pathToRevalidate);
        }

        return NextResponse.json({ url });
    } catch (err) {
        console.error("Upload error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { url } = body;

        if (!url) {
            return NextResponse.json(
                { error: "Missing url" },
                { status: 400 }
            );
        }

        // Only delete URLs that are actually in our Supabase Storage media bucket
        if (!url.includes("/storage/v1/object/public/media/")) {
            return NextResponse.json({ success: true, ignored: true });
        }

        // Extract the filename portion (e.g., "projectId/timestamp.jpg")
        const urlParts = url.split("/media/");
        if (urlParts.length !== 2) {
            return NextResponse.json(
                { error: "Invalid URL format" },
                { status: 400 }
            );
        }

        const filename = urlParts[1];
        const supabase = await createServerSupabase();

        const { error } = await supabase.storage
            .from("media")
            .remove([filename]);

        if (error) {
            console.error("Storage remove error:", error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Delete error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
