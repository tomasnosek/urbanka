"use client";

import { useEffect, useState } from "react";
import styles from "./Toast.module.css";

export type ToastStatus = "idle" | "saving" | "success" | "error";

interface ToastProps {
    status: ToastStatus;
    message?: string;
}

export function Toast({ status, message }: ToastProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (status === "saving" || status === "error") {
            setVisible(true);
        } else if (status === "success") {
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 1500);
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [status]);

    const isError = status === "error";
    const label =
        message ||
        (status === "saving" ? "Ukládám…" :
         status === "success" ? "Uloženo" :
         status === "error" ? "Chyba při ukládání" : "");

    return (
        <div
            className={`${styles.toast} ${visible ? styles.visible : ""} ${isError ? styles.error : ""}`}
            role="status"
            aria-live="polite"
        >
            {status === "saving" && <div className={styles.spinner} />}
            {status === "success" && <span className={styles.icon}>✓</span>}
            {status === "error" && <span className={styles.icon}>✕</span>}
            <span>{label}</span>
        </div>
    );
}
