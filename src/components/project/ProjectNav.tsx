import Link from "next/link";
import styles from "./ProjectNav.module.css";

interface ProjectNavItem {
    title: string;
    slug: string;
}

interface ProjectNavProps {
    municipalitySlug: string;
    prev: ProjectNavItem | null;
    next: ProjectNavItem | null;
}

export function ProjectNav({ municipalitySlug, prev, next }: ProjectNavProps) {
    if (!prev && !next) return null;

    return (
        <nav className={styles.nav}>
            {prev ? (
                <Link
                    href={`/${municipalitySlug}/${prev.slug}`}
                    className={styles.link}
                >
                    <span className={styles.direction}>← Předchozí projekt</span>
                    <span className={styles.projectTitle}>{prev.title}</span>
                </Link>
            ) : (
                <div />
            )}
            {next ? (
                <Link
                    href={`/${municipalitySlug}/${next.slug}`}
                    className={`${styles.link} ${styles.linkRight}`}
                >
                    <span className={styles.direction}>Následující projekt →</span>
                    <span className={styles.projectTitle}>{next.title}</span>
                </Link>
            ) : (
                <div />
            )}
        </nav>
    );
}
