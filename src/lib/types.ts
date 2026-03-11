/* =============================================
   URBANKA — TypeScript Types
   ============================================= */

export interface Municipality {
    id: string;
    name: string;
    slug: string;
    created_at: string;
}

export interface TimelineImage {
    url: string;
    caption: string;
}

export interface TimelineItem {
    id: string;
    date: string;
    title: string;
    description: string;
    images: TimelineImage[];
}

export interface ContentBlock {
    id: string;
    title: string;
    content: string;
    imageUrl: string;
    imagePosition: "left" | "right";
}

export interface StatItem {
    label: string;
    value: string;
}

export interface Block<T = any> {
    id: string;
    type: "hero" | "stats" | "contentBlockLeft" | "contentBlockRight" | "timeline";
    data: T;
}

export interface ProjectContent {
    meta: {
        status: string;
        updateDate: string;
    };
    blocks: Block[];
}

export interface Project {
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

export interface Feedback {
    id: string;
    project_id: string;
    name: string | null;
    email: string | null;
    message: string;
    category: "question" | "error" | "spam" | "toxic" | null;
    is_read: boolean;
    created_at: string;
}
