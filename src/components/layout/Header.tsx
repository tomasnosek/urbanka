import Link from "next/link";
import styles from "./Header.module.css";

interface HeaderProps {
    municipalityName?: string;
}

export function Header({ municipalityName }: HeaderProps) {
    return (
        <header className={styles.header}>
            <div className={styles.headerInner}>
                <Link href="/" className={styles.logo}>
                    <div className={styles.logoMark} />
                    <span className={styles.logoText}>
                        Urbanka{municipalityName ? ` ${municipalityName}` : ""}
                    </span>
                </Link>
                <nav className={styles.nav}>
                    <Link href="/" className={styles.navLink}>
                        Přehled projektů
                    </Link>
                </nav>
            </div>
        </header>
    );
}
