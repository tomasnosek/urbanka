import styles from "./ConfirmDialog.module.css";
import { useEffect, useState } from "react";

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
}

export function ConfirmDialog({
    isOpen,
    title,
    onConfirm,
    onCancel,
    confirmText = "Smazat",
    cancelText = "Zrušit",
}: ConfirmDialogProps) {
    const [shouldRender, setShouldRender] = useState(false);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setIsAnimatingOut(false);
        } else if (shouldRender) {
            setIsAnimatingOut(true);
            const timer = setTimeout(() => {
                setShouldRender(false);
                setIsAnimatingOut(false);
            }, 300); // matches animation duration
            return () => clearTimeout(timer);
        }
    }, [isOpen, shouldRender]);

    if (!shouldRender) return null;

    return (
        <div className={`${styles.overlay} ${isAnimatingOut ? styles.fadeOut : styles.fadeIn}`}>
            <div className={`${styles.dialog} ${isAnimatingOut ? styles.zoomOut : styles.bounceIn}`}>
                <p className={styles.title}>{title}</p>
                <div className={styles.actions}>
                    <button className={styles.cancelBtn} onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className={styles.confirmBtn} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
