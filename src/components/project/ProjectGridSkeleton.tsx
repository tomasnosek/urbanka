import styles from "./ProjectGridSkeleton.module.css";
import { AddProjectSkeleton } from "./AddProjectSkeleton";

interface ProjectGridSkeletonProps {
    municipalityId: string;
    municipalitySlug: string;
    count?: number;
}

export function ProjectGridSkeleton({ municipalityId, municipalitySlug, count = 3 }: ProjectGridSkeletonProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
            <AddProjectSkeleton municipalityId={municipalityId} municipalitySlug={municipalitySlug} />
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={styles.skeletonWrapper}>
                    <div className={styles.skeletonCard}>
                        <div className={styles.skeletonImage} />
                        <div className={styles.skeletonBody}>
                            <div className={styles.skeletonStatus} />
                            <div className={styles.skeletonTitle} />
                            <div className={styles.skeletonLead}>
                                <div className={styles.skeletonLine} />
                                <div className={styles.skeletonLine} />
                                <div className={styles.skeletonLine} />
                            </div>
                            <div className={styles.skeletonMeta} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
