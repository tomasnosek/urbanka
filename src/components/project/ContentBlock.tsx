"use client";

import { EditableText } from "@/components/editor/EditableText";
import { EditableImage } from "@/components/editor/EditableImage";
import styles from "./ContentBlock.module.css";
import type { ContentBlock as ContentBlockType } from "@/lib/types";

interface ContentBlockProps {
    block: ContentBlockType;
    index: number;
    projectId: string;
    blockIndex: number;
}

export function ContentBlock({ block, index, projectId, blockIndex }: ContentBlockProps) {
    const reverse = block.imagePosition === "left";

    return (
        <section
            className={`${styles.block} ${reverse ? styles.reverse : ""}`}
        >
            <div className={styles.text}>
                <EditableText
                    value={block.title}
                    path={`blocks.${blockIndex}.data.title`}
                    projectId={projectId}
                    as="h2"
                    className={styles.title}
                />
                <EditableText
                    value={block.content}
                    path={`blocks.${blockIndex}.data.content`}
                    projectId={projectId}
                    as="p"
                    className={styles.content}
                    multiline
                />
            </div>
            <div className={styles.image}>
                <EditableImage
                    src={block.imageUrl}
                    alt={block.title}
                    path={`blocks.${blockIndex}.data.imageUrl`}
                    projectId={projectId}
                />
            </div>
        </section>
    );
}
