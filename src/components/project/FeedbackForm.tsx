"use client";

import { useState } from "react";
import styles from "./FeedbackForm.module.css";

interface FeedbackFormProps {
    projectId: string;
}

export function FeedbackForm({ projectId }: FeedbackFormProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [honeypot, setHoneypot] = useState("");
    const [status, setStatus] = useState<
        "idle" | "sending" | "sent" | "error"
    >("idle");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // Honeypot check — bots fill this hidden field
        if (honeypot) return;

        if (!message.trim()) return;

        setStatus("sending");

        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, name, email, message }),
            });

            if (!res.ok) throw new Error("Failed to send");

            setStatus("sent");
            setName("");
            setEmail("");
            setMessage("");
        } catch {
            setStatus("error");
        }
    }

    return (
        <section className={styles.section}>
            <h2 className={`${styles.title} text-h2`}>Máte dotaz nebo připomínku?</h2>
            <p className={styles.subtitle}>
                Napište nám. Vaše zpráva bude doručena správci portálu.
            </p>

            {status === "sent" ? (
                <div className={styles.successMessage}>
                    <span className={styles.successIcon}>✓</span>
                    Děkujeme za vaši zprávu. Budeme se jí věnovat.
                </div>
            ) : (
                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Honeypot field — hidden from humans */}
                    <div className={styles.honeypot} aria-hidden="true">
                        <label htmlFor="website">Website</label>
                        <input
                            id="website"
                            type="text"
                            name="website"
                            tabIndex={-1}
                            autoComplete="off"
                            value={honeypot}
                            onChange={(e) => setHoneypot(e.target.value)}
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label htmlFor="feedback-name" className={styles.label}>
                                Jméno <span className={styles.optional}>(nepovinné)</span>
                            </label>
                            <input
                                id="feedback-name"
                                type="text"
                                className={styles.input}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Jan Novák"
                            />
                        </div>
                        <div className={styles.field}>
                            <label htmlFor="feedback-email" className={styles.label}>
                                E-mail <span className={styles.optional}>(nepovinné)</span>
                            </label>
                            <input
                                id="feedback-email"
                                type="email"
                                className={styles.input}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="jan@example.cz"
                            />
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="feedback-message" className={styles.label}>
                            Zpráva
                        </label>
                        <textarea
                            id="feedback-message"
                            className={styles.textarea}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Napište svůj dotaz nebo připomínku..."
                            rows={4}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.button}
                        disabled={status === "sending"}
                    >
                        {status === "sending" ? "Odesílám..." : "Odeslat zprávu"}
                    </button>

                    {status === "error" && (
                        <p className={styles.errorText}>
                            Nepodařilo se odeslat. Zkuste to prosím znovu.
                        </p>
                    )}
                </form>
            )}
        </section>
    );
}
