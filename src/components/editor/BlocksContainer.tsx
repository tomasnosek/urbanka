"use client";

import { useState, useCallback } from "react";
import { HeroSection } from "@/components/project/HeroSection";
import { StatsBar } from "@/components/project/StatsBar";
import { ContentBlock } from "@/components/project/ContentBlock";
import { Timeline } from "@/components/project/Timeline";
import { Gallery } from "@/components/project/Gallery";
import { SectionWrapper } from "@/components/editor/SectionWrapper";
import { Toast, ToastStatus } from "@/components/ui/Toast";

interface BlocksContainerProps {
    initialBlocks: any[];
    meta: {
        status: string;
        updateDate: string;
    };
    projectId: string;
}

export function BlocksContainer({ initialBlocks, meta, projectId }: BlocksContainerProps) {
    const [blocks, setBlocks] = useState(initialBlocks);
    const [toastStatus, setToastStatus] = useState<ToastStatus>("idle");
    const [toastMessage, setToastMessage] = useState<string | undefined>();

    const showToast = useCallback((status: ToastStatus, message?: string) => {
        setToastStatus(status);
        setToastMessage(message);
    }, []);

    // --- Optimistic Move ---
    const handleMove = useCallback(async (blockIndex: number, direction: "up" | "down") => {
        const newIndex = direction === "up" ? blockIndex - 1 : blockIndex + 1;
        if (newIndex < 0 || newIndex >= blocks.length) return;

        // 1. Optimistic: swap instantly
        const reordered = [...blocks];
        const [moved] = reordered.splice(blockIndex, 1);
        reordered.splice(newIndex, 0, moved);
        setBlocks(reordered);

        // 2. Save to DB in background
        showToast("saving");
        try {
            const res = await fetch("/api/content/reorder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    path: "blocks",
                    oldIndex: blockIndex,
                    newIndex,
                }),
            });
            if (res.ok) {
                showToast("success");
            } else {
                // Revert on failure
                setBlocks(blocks);
                showToast("error", "Nepodařilo se přesunout sekci");
            }
        } catch {
            // Revert on error
            setBlocks(blocks);
            showToast("error", "Chyba při ukládání");
        }
    }, [blocks, projectId, showToast]);

    // --- Optimistic Delete ---
    const handleDelete = useCallback(async (blockIndex: number) => {
        // 1. Optimistic: remove instantly
        const previous = [...blocks];
        const updated = blocks.filter((_, i) => i !== blockIndex);
        setBlocks(updated);

        // 2. Save to DB in background
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
        }
    }, [blocks, projectId, showToast]);

    return (
        <>
            {blocks.map((block: any, index: number) => (
                <SectionWrapper
                    key={block.id}
                    blockId={block.id}
                    blockIndex={index}
                    totalBlocks={blocks.length}
                    onMove={(direction) => handleMove(index, direction)}
                    onDelete={() => handleDelete(index)}
                >
                    {block.type === "hero" && (
                        <HeroSection
                            title={block.data.title}
                            lead={block.data.lead}
                            imageUrl={block.data.imageUrl}
                            imageCaption={block.data.imageCaption}
                            status={meta.status}
                            updateDate={meta.updateDate}
                            projectId={projectId}
                            blockIndex={index}
                        />
                    )}
                    {block.type === "stats" && (
                        <div className="layout-wrap">
                            <StatsBar
                                stats={block.data}
                                projectId={projectId}
                                blockIndex={index}
                            />
                        </div>
                    )}
                    {(block.type === "contentBlockLeft" || block.type === "contentBlockRight") && (
                        <div className="layout-wrap">
                            <ContentBlock
                                block={block.data}
                                index={block.type === "contentBlockLeft" ? 1 : 0}
                                projectId={projectId}
                                blockIndex={index}
                            />
                        </div>
                    )}
                    {block.type === "timeline" && block.data?.length > 0 && (
                        <div className="layout-wrap-overflow">
                            <Timeline
                                items={block.data}
                                projectId={projectId}
                                blockIndex={index}
                            />
                        </div>
                    )}
                    {block.type === "gallery" && (
                        <Gallery
                            images={block.data}
                            projectId={projectId}
                            blockIndex={index}
                        />
                    )}
                </SectionWrapper>
            ))}

            <Toast status={toastStatus} message={toastMessage} />
        </>
    );
}
