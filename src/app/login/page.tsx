/* =============================================
   URBANKA — Login Page
   ============================================= */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { login, isAdmin } = useAuth();
    const router = useRouter();

    // If already logged in, redirect home
    useEffect(() => {
        if (isAdmin) router.push("/");
    }, [isAdmin, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const result = await login(email, password);
        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            router.push("/");
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.logo}>■</div>
                    <h1 className={styles.title}>Urbanka</h1>
                    <p className={styles.subtitle}>
                        Přihlášení do administrace
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.field}>
                        <label htmlFor="login-email" className={styles.label}>
                            E-mail
                        </label>
                        <input
                            id="login-email"
                            type="email"
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@urbanka.cz"
                            required
                            autoFocus
                        />
                    </div>

                    <div className={styles.field}>
                        <label
                            htmlFor="login-password"
                            className={styles.label}
                        >
                            Heslo
                        </label>
                        <input
                            id="login-password"
                            type="password"
                            className={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={loading}
                    >
                        {loading ? "Přihlašuji…" : "Přihlásit se"}
                    </button>
                </form>
            </div>
        </div>
    );
}
