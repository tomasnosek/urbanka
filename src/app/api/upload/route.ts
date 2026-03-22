/* =============================================
   URBANKA — Image Upload API Route
   Saves to Supabase Storage
   ============================================= */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get("content-type") || "";
        let bytes: ArrayBuffer;
        let fileType: string;
        let fallbackExt: string;
        let projectId: string;
        let path: string;
        let pathToRevalidate: string | null = null;
        let filenameUrlPrefix = "";

        // Handle URL upload
        if (contentType.includes("application/json")) {
            const body = await request.json();
            projectId = body.projectId;
            path = body.path;
            pathToRevalidate = body.revalidatePath || null;
            
            if (!body.imageUrl || !projectId || !path) {
                return NextResponse.json({ error: "Missing fields" }, { status: 400 });
            }

            const imageResponse = await fetch(body.imageUrl);
            if (!imageResponse.ok) {
                return NextResponse.json({ error: "Failed to fetch image" }, { status: 400 });
            }

            bytes = await imageResponse.arrayBuffer();
            fileType = imageResponse.headers.get("content-type") || "image/jpeg";
            fallbackExt = fileType.split("/").pop() || "jpg";
            filenameUrlPrefix = "url-";
        } else {
            // Check FormData
            const formData = await request.formData();
            const file = formData.get("file") as File | null;
            projectId = formData.get("projectId") as string;
            path = formData.get("path") as string;
            pathToRevalidate = formData.get("revalidatePath") as string | null;

            if (!file || !projectId || !path) {
                return NextResponse.json(
                    { error: "Missing file, projectId, or path" },
                    { status: 400 }
                );
            }

            if (!file.type.startsWith("image/")) {
                return NextResponse.json(
                    { error: "Only image files are allowed" },
                    { status: 400 }
                );
            }

            bytes = await file.arrayBuffer();
            fileType = file.type;
            fallbackExt = file.name.split(".").pop() ?? "jpg";
        }

        const supabase = await createServerSupabase();
        
        const isWebp = fileType === "image/webp";
        const ext = isWebp ? "webp" : fallbackExt;

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${projectId}/${filenameUrlPrefix}${timestamp}.${ext}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from("media")
            .upload(filename, Buffer.from(bytes), {
                contentType: fileType,
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
