import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { municipality_id } = body;

        if (!municipality_id) {
            return NextResponse.json(
                { error: "Municipality ID is required" },
                { status: 400 }
            );
        }

        const supabase = await createServerSupabase();

        // Check if municipality exists
        const { data: municipality, error: munError } = await supabase
            .from("municipalities")
            .select("slug")
            .eq("id", municipality_id)
            .single();

        if (munError || !municipality) {
            return NextResponse.json(
                { error: "Municipality not found" },
                { status: 404 }
            );
        }

        // Generate a random ID for slug to avoid collisions
        const randomId = Math.random().toString(36).substring(2, 8);
        const slug = `novy-projekt-${randomId}`;
        const title = "Nový projekt";

        // Generate default JSONB content structure using the block schema
        const defaultContent = {
            meta: {
                status: "Návrh",
                updateDate: new Date().toLocaleDateString("cs-CZ"),
            },
            blocks: [
                {
                    id: "hero-1",
                    type: "hero",
                    data: {
                        title: "Název nového projektu",
                        lead: "Krátké shrnutí projektu nebo poutavý perex. Rozepište se o hlavních cílech a důvodech vzniku tohoto záměru.",
                        imageUrl: "/images/black.png",
                        imageCaption: "Ilustrační snímek",
                    }
                },
                {
                    id: "stats-1",
                    type: "stats",
                    data: [
                        { label: "Předpokládaná cena", value: "0 Kč" },
                        { label: "Zahájení", value: "Neznámé" },
                        { label: "Dokončení", value: "Neznámé" }
                    ]
                },
                {
                    id: "text-1",
                    type: "text",
                    data: {
                        heading: "Slovo starosty",
                        body: "Zde můžete dopsat úvodní slovo zástupce obce k tomuto projektu. Text by měl obsahovat vyjádření podpory a vysvětlení, proč je projekt pro obec důležitý.",
                    }
                },
                {
                    id: "image-text-1",
                    type: "image-text",
                    data: {
                        heading: "Popis záměru",
                        body: "Zde rozveďte technické nebo architektonické detaily. Můžete popsat jednotlivé fáze výstavby, použitou technologii nebo přínos pro obyvatele.",
                        imageUrl: "/images/black.png",
                        imageCaption: "Vizualizace",
                        reverse: false,
                    }
                },
                {
                    id: "timeline-1",
                    type: "timeline",
                    data: [
                        {
                            id: Math.random().toString(36).substring(2, 9),
                            date: new Date().toLocaleDateString("cs-CZ"),
                            title: "Založení karty projektu",
                            description: "Úvodní definice záměru a spuštění přípravných prací.",
                            images: []
                        }
                    ]
                }
            ],
        };

        const { data: newProject, error: insertError } = await supabase
            .from("projects")
            .insert({
                municipality_id,
                title,
                slug,
                status: "draft",
                content: defaultContent,
            })
            .select()
            .single();

        if (insertError) {
            console.error("Supabase insert error:", insertError);
            return NextResponse.json(
                { error: "Failed to create project in database" },
                { status: 500 }
            );
        }

        revalidatePath('/', 'layout');

        // Return the final URL to immediately redirect to the edit mode
        const editUrl = `/${municipality.slug}/${slug}?edit=true`;

        return NextResponse.json({
            success: true,
            project: newProject,
            redirectUrl: editUrl
        });

    } catch (error) {
        console.error("Create blank project error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
