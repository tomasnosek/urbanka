import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase-server";
import { extractDataFromMultipleFiles } from "@/lib/gemini";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();

        // Ensure user is authenticated
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.split("Bearer ")[1];
        const { data: { session } } = await supabase.auth.getSession();

        if (!session && !token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const municipalityId = formData.get("municipalityId") as string;

        if (!municipalityId) {
            return NextResponse.json({ error: "Municipality ID is required" }, { status: 400 });
        }

        const { data: municipality, error: munError } = await supabase
            .from("municipalities")
            .select("slug")
            .eq("id", municipalityId)
            .single();

        if (munError || !municipality) {
            return NextResponse.json({ error: "Municipality not found" }, { status: 404 });
        }

        // Parse files and comments
        const filesToProcess: { buffer: Buffer, mimeType: string, comment: string }[] = [];
        let index = 0;

        while (formData.has(`file_${index}`)) {
            const file = formData.get(`file_${index}`) as File;
            const comment = formData.get(`comment_${index}`) as string || "";

            if (file) {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                filesToProcess.push({
                    buffer,
                    mimeType: file.type,
                    comment
                });
            }
            index++;
        }

        if (filesToProcess.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        // Extract data
        const extractedContent = await extractDataFromMultipleFiles(filesToProcess);

        // Save to DB
        const randomId = Math.random().toString(36).substring(2, 8);
        const slug = `novy-projekt-${randomId}`;
        const title = extractedContent?.hero?.title || "Nový projekt z dokumentů";

        const { data: newProject, error: insertError } = await supabase
            .from("projects")
            .insert({
                municipality_id: municipalityId,
                title,
                slug,
                status: "draft",
                content: extractedContent,
            })
            .select()
            .single();

        if (insertError) {
            console.error("Supabase insert error:", insertError);
            return NextResponse.json({ error: "Failed to create project in database" }, { status: 500 });
        }

        const editUrl = `/${municipality.slug}/${slug}?edit=true`;

        revalidatePath('/', 'layout');

        return NextResponse.json({
            success: true,
            project: newProject,
            redirectUrl: editUrl
        });

    } catch (error: any) {
        console.error("Create from files error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
