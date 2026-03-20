import Link from "next/link";
import styles from "./Footer.module.css";

interface FooterProps {
    municipalityName?: string;
}

export function Footer({ municipalityName }: FooterProps) {
    const year = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.footerInner}>
                <div className={styles.footerText}>
                    © {year}
                    {municipalityName
                        ? ` ${municipalityName}.`
                        : ""}{" "}
                    Informační portál Urbanka.
                </div>
                <div className={styles.footerLinks}>
                    <Link href="/login" className={styles.loginLink}>
                        Přihlásit se
                    </Link>
                </div>
            </div>
        </footer>
    );
}
