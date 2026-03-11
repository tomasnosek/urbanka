import { z } from "zod";

export const TimelineImageSchema = z.object({
    url: z.string().url("Must be a valid URL"),
    caption: z.string().optional(),
});

export const TimelineItemSchema = z.object({
    id: z.string(),
    date: z.string(),
    title: z.string(),
    description: z.string(),
    images: z.array(TimelineImageSchema).optional().default([]),
});

export const ContentBlockSchema = z.object({
    title: z.string(),
    content: z.string(),
    imageUrl: z.string().optional(),
    imagePosition: z.enum(["left", "right"]).optional(),
});

export const HeroSchema = z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    backgroundImageUrl: z.string().optional(),
});

export const StatItemSchema = z.object({
    label: z.string(),
    value: z.string(),
});

export const StatsSchema = z.object({
    items: z.array(StatItemSchema),
});

// A central schema to validate individual block data based on its type
export const BlockDataSchema = z.union([
    HeroSchema,
    StatsSchema,
    ContentBlockSchema,
    z.object({ items: z.array(TimelineItemSchema) }) // For timeline type
]);

export const BlockSchema = z.object({
    id: z.string(),
    type: z.enum(["hero", "stats", "contentBlockLeft", "contentBlockRight", "timeline"]),
    data: z.any() // In actual usage, we validate shape dynamically or trust it mostly if we use tight type unions
});

export const ProjectContentSchema = z.object({
    meta: z.object({
        status: z.string().optional(),
        updateDate: z.string().optional(),
    }).optional(),
    blocks: z.array(BlockSchema).optional().default([]),
});

// Validate individual field updates
export const JsonUpdateSchema = z.object({
    projectId: z.string().uuid(),
    path: z.string(),
    value: z.any(),
});
