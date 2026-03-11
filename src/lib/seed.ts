/* =============================================
   URBANKA — Database Seed Script
   Run with: npx tsx src/lib/seed.ts
   ============================================= */

import { readFileSync } from "fs";
import { resolve } from "path";

// Manually load .env.local (tsx doesn't load it automatically)
const envPath = resolve(process.cwd(), ".env.local");
try {
    const envContent = readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex === -1) continue;
        const key = trimmed.slice(0, eqIndex);
        const value = trimmed.slice(eqIndex + 1);
        if (!process.env[key]) process.env[key] = value;
    }
} catch {
    console.error("Could not read .env.local at", envPath);
}

import { municipalities, projects } from "./mock-data";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error(
        "Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seed() {
    console.log("🌱 Seeding database...\n");

    // Map mock IDs → real UUIDs
    const idMap = new Map<string, string>();

    // 1. Insert municipalities (let DB generate UUIDs)
    for (const m of municipalities) {
        const { data, error } = await supabase
            .from("municipalities")
            .upsert(
                { name: m.name, slug: m.slug },
                { onConflict: "slug" }
            )
            .select("id")
            .single();

        if (error) {
            console.error(`  ❌ Municipality "${m.name}":`, error.message);
        } else {
            console.log(`  ✅ Municipality "${m.name}" → ${data.id}`);
            idMap.set(m.id, data.id);
        }
    }

    // 2. Insert projects (use real municipality UUID)
    for (const p of projects) {
        const realMunicipalityId = idMap.get(p.municipality_id);
        if (!realMunicipalityId) {
            console.error(`  ❌ Project "${p.title}": municipality not found`);
            continue;
        }

        const { data, error } = await supabase
            .from("projects")
            .upsert(
                {
                    municipality_id: realMunicipalityId,
                    title: p.title,
                    slug: p.slug,
                    status: p.status,
                    total_cost: p.total_cost,
                    content: p.content,
                    source_pdf_url: p.source_pdf_url,
                    ai_confidence: p.ai_confidence,
                    published_at: p.published_at,
                },
                { onConflict: "municipality_id,slug" }
            )
            .select("id")
            .single();

        if (error) {
            console.error(`  ❌ Project "${p.title}":`, error.message);
        } else {
            console.log(`  ✅ Project "${p.title}" → ${data.id}`);
        }
    }

    console.log("\n🎉 Seed complete!");
}

seed();
