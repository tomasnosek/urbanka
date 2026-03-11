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
            </div>
        </footer>
    );
}
