"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { HeroSection } from "@/components/project/HeroSection";
import { StatsBar } from "@/components/project/StatsBar";
import { ContentBlock } from "@/components/project/ContentBlock";
import { Timeline } from "@/components/project/Timeline";
import { Gallery } from "@/components/project/Gallery";
import { MayorSection } from "@/components/project/MayorSection";
import { SectionWrapper } from "@/components/editor/SectionWrapper";
import { BlockErrorBoundary } from "@/components/editor/BlockErrorBoundary";
import { useToast } from "@/components/ui/ToastContext";

interface BlocksContainerProps {
    initialBlocks: any[];
    meta: {
        status: string;
        updateDate: string;
    };
    projectId: string;
    projectTitle: string;
}

// ─── Block Registry ────────────────────────────────────────────────────────────
type RenderFn = (ctx: {
    data: any;
    projectId: string;
    blockIndex: number;
    meta?: any;
    projectTitle?: string;
}) => React.ReactNode;

const BLOCK_REGISTRY: Record<string, {
    wrapper?: "layout-wrap" | "layout-wrap-overflow";
    render: RenderFn;
}> = {
    hero: {
        render: ({ data, projectId, blockIndex, meta, projectTitle }) => (
            <HeroSection
                title={projectTitle ?? ""}
                lead={data.lead}
                imageUrl={data.imageUrl}
                imageCaption={data.imageCaption}
                status={meta.status}
                updateDate={meta.updateDate}
                projectId={projectId}
                blockIndex={blockIndex}
            />
        ),
    },
    stats: {
        wrapper: "layout-wrap",
        render: ({ data, projectId, blockIndex }) => (
            <StatsBar stats={data} projectId={projectId} blockIndex={blockIndex} />
        ),
    },
    contentBlockLeft: {
        wrapper: "layout-wrap",
        render: ({ data, projectId, blockIndex }) => (
            <ContentBlock block={data} index={1} projectId={projectId} blockIndex={blockIndex} />
        ),
    },
    contentBlockRight: {
        wrapper: "layout-wrap",
        render: ({ data, projectId, blockIndex }) => (
            <ContentBlock block={data} index={0} projectId={projectId} blockIndex={blockIndex} />
        ),
    },
    timeline: {
        wrapper: "layout-wrap-overflow",
        render: ({ data, projectId, blockIndex }) =>
            data?.length > 0 ? (
                <Timeline items={data} projectId={projectId} blockIndex={blockIndex} />
            ) : null,
    },
    gallery: {
        render: ({ data, projectId, blockIndex }) => (
            <Gallery images={data} projectId={projectId} blockIndex={blockIndex} />
        ),
    },
    mayor: {
        wrapper: "layout-wrap",
        render: ({ data, projectId, blockIndex }) => (
            <MayorSection block={data} projectId={projectId} blockIndex={blockIndex} />
        ),
    },
};

export function BlocksContainer({ initialBlocks, meta, projectId, projectTitle }: BlocksContainerProps) {
    const [blocks, setBlocks] = useState(initialBlocks);
    const { showToast } = useToast();
    // Prevent server re-sync from overwriting our optimistic state during an in-flight operation
    const isOperating = useRef(false);

    useEffect(() => {
        // Skip sync if we are in the middle of an optimistic update
        if (isOperating.current) return;
        setBlocks(initialBlocks);
    }, [JSON.stringify(initialBlocks)]);

    const handleMove = useCallback(async (blockIndex: number, direction: "up" | "down") => {
        const newIndex = direction === "up" ? blockIndex - 1 : blockIndex + 1;
        if (newIndex < 0 || newIndex >= blocks.length) return;

        // Snapshot before change for potential rollback
        const previous = [...blocks];

        // Optimistic update
        isOperating.current = true;
        const reordered = [...blocks];
        const [moved] = reordered.splice(blockIndex, 1);
        reordered.splice(newIndex, 0, moved);
        setBlocks(reordered);

        showToast("saving");
        try {
            const res = await fetch("/api/content/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, path: "blocks", oldIndex: blockIndex, newIndex }),
            });
            if (res.ok) {
                showToast("success");
            } else {
                setBlocks(previous);
                showToast("error", "Nepodařilo se přesunout sekci");
            }
        } catch {
            setBlocks(previous);
            showToast("error", "Chyba při ukládání");
        } finally {
            isOperating.current = false;
        }
    }, [blocks, projectId, showToast]);

    const handleDelete = useCallback(async (blockIndex: number) => {
        const previous = [...blocks];
        const updated = blocks.filter((_, i) => i !== blockIndex);

        isOperating.current = true;
        setBlocks(updated);

        showToast("saving");
        try {
            const res = await fetch("/api/content/remove", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, type: "block", blockIndex }),
            });
            if (res.ok) {
                showToast("success");
            } else {
                setBlocks(previous);
                showToast("error", "Nepodařilo se smazat sekci");
            }
        } catch {
            setBlocks(previous);
            showToast("error", "Chyba při mazání");
        } finally {
            isOperating.current = false;
        }
    }, [blocks, projectId, showToast]);

    return (
        <>
            {blocks.map((block: any, index: number) => {
                const entry = BLOCK_REGISTRY[block.type];
                if (!entry) return null;

                const rendered = entry.render({
                    data: block.data,
                    projectId,
                    blockIndex: index,
                    meta,
                    projectTitle,
                });

                const content = entry.wrapper
                    ? <div className={entry.wrapper}>{rendered}</div>
                    : rendered;

                return (
                    <SectionWrapper
                        key={block.id}
                        blockId={block.id}
                        blockIndex={index}
                        totalBlocks={blocks.length}
                        onMove={(direction) => handleMove(index, direction)}
                        onDelete={() => handleDelete(index)}
                    >
                        <BlockErrorBoundary blockType={block.type}>
                            {content}
                        </BlockErrorBoundary>
                    </SectionWrapper>
                );
            })}
        </>
    );
}
