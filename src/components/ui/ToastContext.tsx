"use client";

import { createContext, useContext, useCallback, useState, type ReactNode } from "react";
import { Toast, type ToastStatus } from "./Toast";

interface ToastContextValue {
    showToast: (status: ToastStatus, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
    showToast: () => {},
});

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<ToastStatus>("idle");
    const [message, setMessage] = useState<string | undefined>();

    const showToast = useCallback((newStatus: ToastStatus, newMessage?: string) => {
        setStatus(newStatus);
        setMessage(newMessage);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Toast status={status} message={message} />
        </ToastContext.Provider>
    );
}
