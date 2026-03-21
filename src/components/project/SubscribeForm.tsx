"use client";

import { useState } from "react";
import styles from "./SubscribeForm.module.css";

interface SubscribeFormProps {
    projectId: string;
}

export function SubscribeForm({ projectId }: SubscribeFormProps) {
    const [email, setEmail] = useState("");
    const [honeypot, setHoneypot] = useState("");
    const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim()) return;
        if (honeypot) return; // Silently ignore bots
        setStatus("sending");

        try {
            const res = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, email, honeypot }),
            });

            if (!res.ok) throw new Error();
            setStatus("sent");
        } catch {
            setStatus("error");
        }
    }

    if (status === "sent") {
        return (
            <div className={styles.success}>
                <span className={styles.checkmark}>✓</span>
                <span>Super! Jakmile se projekt změní, dáme vám vědět na <strong>{email}</strong>.</span>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <p className={styles.label}>Sledovat tento projekt</p>
            <form className={styles.form} onSubmit={handleSubmit}>
                {/* Honeypot — hidden from humans, bots fill it */}
                <div style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
                    <input
                        type="text"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                    />
                </div>
                <input
                    type="email"
                    className={styles.input}
                    placeholder="vas@email.cz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={status === "sending"}
                />
                <button
                    type="submit"
                    className={styles.button}
                    disabled={status === "sending"}
                >
                    {status === "sending" ? "Ukládám…" : "Odebírat"}
                </button>
            </form>
            {status === "error" && (
                <p className={styles.error}>Registrace se nepodařila. Zkuste to prosím znovu.</p>
            )}
        </div>
    );
}
