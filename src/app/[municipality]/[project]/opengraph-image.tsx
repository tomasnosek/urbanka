import { ImageResponse } from "next/og";
import { createServerSupabase } from "@/lib/supabase-server";
import { readFileSync } from "fs";
import { join } from "path";

// Revalidate this OG image every hour to keep it fresh
export const revalidate = 3600;

export const alt = "Náhledový obrázek pro projekt";

export const size = {
    width: 1200,
    height: 630,
};

export const contentType = "image/png";

// Load custom font at build time using fs (fetch doesn't work during static generation)
const fontData = readFileSync(join(process.cwd(), "public", "Ranade-Medium.otf"));

export default async function Image({ params }: { params: { municipality: string; project: string } }) {
    try {
        const { municipality, project } = params;

        // Init Supabase
        const supabase = await createServerSupabase();

        // Fetch municipality & project data
        const { data: dbMunicipality } = await supabase
            .from("municipalities")
            .select("name, emblem_url")
            .eq("slug", municipality)
            .single();

        const { data: dbProject } = await supabase
            .from("projects")
            .select("title, content")
            .eq("slug", project)
            .single();

        const munName = dbMunicipality?.name || municipality;
        const emblemUrl = dbMunicipality?.emblem_url || null;
        const proTitle = dbProject?.title || "Projekt";

        // Try to find the hero image from content.blocks
        let heroImageUrl = "/images/black.png"; // Fallback placeholder
        if (dbProject?.content?.blocks) {
            const heroBlock = dbProject.content.blocks.find(
                (b: any) => b.type === "hero"
            );
            if (heroBlock?.data?.imageUrl) {
                // Ensure it's an absolute URL
                if (heroBlock.data.imageUrl.startsWith("http")) {
                    heroImageUrl = heroBlock.data.imageUrl;
                } else if (heroBlock.data.imageUrl.startsWith("/")) {
                    // Prepend host URL for local images (requires absolute URL)
                    const host =
                        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
                    heroImageUrl = `${host}${heroBlock.data.imageUrl}`;
                }
            }
        }

        return new ImageResponse(
            (
                // The wrapper - basically the whole 1200x630 canvas
                <div
                    style={{
                        height: "100%",
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end", // Align text to bottom
                        alignItems: "flex-start",
                        position: "relative",
                        backgroundColor: "#84A98C", // Fallback color
                    }}
                >
                    {/* Background Hero Image */}
                    {heroImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={heroImageUrl}
                            alt=""
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                            }}
                        />
                    )}

                    {/* Gradient overlay for readability */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundImage: "linear-gradient(to top, rgba(47, 62, 70, 0.95), rgba(47, 62, 70, 0.2))",
                        }}
                    />

                    {/* Content Container */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "flex-end",
                            position: "relative",
                            width: "100%",
                            padding: "60px 80px",
                            paddingRight: emblemUrl ? "320px" : "80px", // leave space for absolute emblem
                        }}
                    >
                        {/* Municipality Name */}
                        <div
                            style={{
                                fontSize: "32px",
                                color: "#84A98C", // Sage green from the project definition
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                marginBottom: "16px",
                                fontWeight: 500,
                            }}
                        >
                            {munName}
                        </div>

                        {/* Project Title */}
                        <div
                            style={{
                                fontSize: "76px",
                                color: "#FFFFFF",
                                lineHeight: 1.1,
                                fontWeight: 600,
                                textWrap: "balance", // Helps with typography layout
                                fontFamily: '"Ranade"',
                            }}
                        >
                            {proTitle}
                        </div>
                    </div>

                    {/* Absolute positioned Emblem in the bottom right corner */}
                    {emblemUrl && (
                        <div
                            style={{
                                position: "absolute",
                                bottom: "60px",
                                right: "80px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "180px",
                                height: "180px",
                                backgroundColor: "rgba(255, 255, 255, 0.1)", // Slight transparent backing just in case
                                borderRadius: "50%", // Make it a circle ideally
                                backdropFilter: "blur(10px)",
                                padding: "20px",
                            }}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={emblemUrl}
                                alt="Znak obce"
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                }}
                            />
                        </div>
                    )}
                </div>
            ),
            {
                width: 1200,
                height: 630,
                fonts: [
                    {
                        name: "Ranade",
                        data: fontData,
                        style: "normal",
                        weight: 600,
                    },
                ],
            }
        );
    } catch (e: any) {
        console.error("OG Image generation failed:", e);
        return new Response(`Failed to generate image`, {
            status: 500,
        });
    }
}
