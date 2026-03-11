/* =============================================
   URBANKA — Database Types (mirrors Supabase schema)
   ============================================= */

import { ProjectContent } from "./types";

/* --- Row types matching DB tables --- */

export interface DbMunicipality {
    id: string;
    name: string;
    slug: string;
    emblem_url: string | null;
    created_at: string;
}

export interface DbProject {
    id: string;
    municipality_id: string;
    title: string;
    slug: string;
    status: "draft" | "published" | "archived";
    total_cost: number;
    content: ProjectContent;
    source_pdf_url: string | null;
    ai_confidence: boolean | null;
    created_at: string;
    updated_at: string;
    published_at: string | null;
}

export interface DbFeedback {
    id: string;
    project_id: string;
    name: string | null;
    email: string | null;
    message: string;
    category: "question" | "error" | "spam" | "toxic" | null;
    is_read: boolean;
    created_at: string;
}

/* --- Insert types (omit auto-generated fields) --- */

export type DbMunicipalityInsert = Omit<DbMunicipality, "id" | "created_at">;

export type DbProjectInsert = Omit<
    DbProject,
    "id" | "created_at" | "updated_at"
>;

export type DbFeedbackInsert = Omit<DbFeedback, "id" | "created_at" | "is_read" | "category">;
