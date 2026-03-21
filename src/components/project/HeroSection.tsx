"use client";

import { EditableText } from "@/components/editor/EditableText";
import { EditableImage } from "@/components/editor/EditableImage";
import styles from "./HeroSection.module.css";

interface HeroSectionProps {
    title: string;
    lead: string;
    imageUrl: string;
    imageCaption: string;
    status: string;
    updateDate: string;
    projectId: string;
    blockIndex: number;
}

export function HeroSection({
    title,
    lead,
    imageUrl,
    imageCaption,
    status,
    updateDate,
    projectId,
    blockIndex,
}: HeroSectionProps) {
    return (
        <section className={styles.hero}>
            <div className={`${styles.heroContent} layout-wrap`}>
                <div className={styles.metaRow}>
                    <span className={styles.statusBadge}>
                        <span className={styles.statusDot} />
                        <EditableText
                            value={status}
                            path="meta.status"
                            projectId={projectId}
                        />
                    </span>
                    <span className={styles.updateDate}>
                        Aktualizováno {updateDate}
                    </span>
                </div>
                <EditableText
                    value={title}
                    path="project.title"
                    projectId={projectId}
                    as="h1"
                    className={`${styles.title} text-h1`}
                />
                <EditableText
                    value={lead}
                    path={`blocks.${blockIndex}.data.lead`}
                    projectId={projectId}
                    as="p"
                    className={styles.lead}
                    multiline
                />
            </div>
            <figure className={styles.heroImage}>
                <EditableImage
                    src={imageUrl}
                    alt={title}
                    path={`blocks.${blockIndex}.data.imageUrl`}
                    projectId={projectId}
                />
            </figure>
        </section>
    );
}
