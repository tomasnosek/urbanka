/* =============================================
   URBANKA — Data Access Layer (Supabase queries)
   ============================================= */

import { createServerSupabase } from "./supabase-server";
import type { DbMunicipality, DbProject, DbFeedbackInsert } from "./database.types";

/* --- Municipality queries --- */

export async function getMunicipalities(): Promise<DbMunicipality[]> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
        .from("municipalities")
        .select("*")
        .order("name");

    if (error) {
        console.error("getMunicipalities error:", error);
        return [];
    }
    return data ?? [];
}

export async function getMunicipality(
    slug: string
): Promise<DbMunicipality | null> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
        .from("municipalities")
        .select("*")
        .eq("slug", slug)
        .single();

    if (error) return null;
    return data;
}

/* --- Project queries --- */

export async function getProjectsByMunicipality(
    municipalityId: string
): Promise<DbProject[]> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("municipality_id", municipalityId)
        .order("created_at");

    if (error) {
        console.error("getProjectsByMunicipality error:", error);
        return [];
    }
    return data ?? [];
}

export async function getHomepageProjects(limit = 6): Promise<any[]> {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
        .from("projects")
        .select(`
            *,
            municipality:municipalities(name, slug)
        `)
        .eq("status", "published")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("getHomepageProjects error:", error);
        return [];
    }
    return data ?? [];
}

export async function getProject(
    municipalitySlug: string,
    projectSlug: string
): Promise<{ project: DbProject; municipality: DbMunicipality } | null> {
    // First get municipality
    const municipality = await getMunicipality(municipalitySlug);
    if (!municipality) return null;

    const supabase = await createServerSupabase();
    const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("municipality_id", municipality.id)
        .eq("slug", projectSlug)
        .single();

    if (error || !data) return null;
    return { project: data, municipality };
}

export async function getAdjacentProjects(
    municipalityId: string,
    currentProjectId: string
): Promise<{ prev: DbProject | null; next: DbProject | null }> {
    const projects = await getProjectsByMunicipality(municipalityId);
    const idx = projects.findIndex((p) => p.id === currentProjectId);

    return {
        prev: idx > 0 ? projects[idx - 1] : null,
        next: idx < projects.length - 1 ? projects[idx + 1] : null,
    };
}

/* --- Content update (JSONB patch) --- */

export async function updateProjectContent(
    projectId: string,
    path: string,
    value: string
): Promise<boolean> {
    // Build the JSONB path for PostgreSQL jsonb_set
    // path format: "hero.title" → ["hero", "title"]
    const pathParts = path.split(".");
    const jsonbPath = `{${pathParts.join(",")}}`;

    const supabase = await createServerSupabase();
    const { error } = await supabase.rpc("update_project_content", {
        p_project_id: projectId,
        p_path: jsonbPath,
        p_value: JSON.stringify(value),
    });

    if (error) {
        console.error("updateProjectContent error:", error);
        return false;
    }
    return true;
}

/* --- Feedback --- */

export async function insertFeedback(
    feedback: DbFeedbackInsert
): Promise<boolean> {
    const supabase = await createServerSupabase();
    const { error } = await supabase.from("feedback").insert(feedback);

    if (error) {
        console.error("insertFeedback error:", error);
        return false;
    }
    return true;
}
