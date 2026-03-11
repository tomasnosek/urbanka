import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { extractDataFromPDF } from "@/lib/gemini";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabase();

        // Ensure user is authenticated
        const authHeader = request.headers.get("Authorization");
        const token = authHeader?.split("Bearer ")[1];

        // Fallback session check using cookies if token is not sent directly
        const { data: { session } } = await supabase.auth.getSession();

        if (!session && !token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("pdf") as File;
        const forceProStr = formData.get("forcePro") as string;
        const forcePro = forceProStr === "true";

        if (!file) {
            return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
        }

        if (file.type !== "application/pdf") {
            return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract using Gemini
        const extractedJson = await extractDataFromPDF(buffer, forcePro);

        return NextResponse.json({
            success: true,
            extractedContent: extractedJson
        });

    } catch (error: any) {
        console.error("PDF Extraction Error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
