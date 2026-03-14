/* =============================================
   URBANKA — Not Found Page
   ============================================= */

// Force dynamic rendering to avoid prerender errors
// when env vars are not available at build time
export const dynamic = "force-dynamic";

export default function NotFound() {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "60vh",
                textAlign: "center",
                padding: "var(--space-8)",
            }}
        >
            <h1
                style={{
                    fontSize: "var(--text-4xl)",
                    fontFamily: "var(--font-heading)",
                    color: "var(--color-text)",
                    marginBottom: "var(--space-4)",
                }}
            >
                Stránka nenalezena
            </h1>
            <p
                style={{
                    fontSize: "var(--text-lg)",
                    color: "var(--color-text-secondary)",
                    maxWidth: "480px",
                }}
            >
                Omlouváme se, ale hledaná stránka neexistuje nebo byla přesunuta.
            </p>
            <a
                href="/"
                style={{
                    marginTop: "var(--space-6)",
                    color: "var(--color-sage)",
                    fontWeight: "var(--font-medium)",
                    textDecoration: "none",
                }}
            >
                &larr; Zpět na úvodní stránku
            </a>
        </div>
    );
}
