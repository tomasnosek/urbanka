"use client";

import { createContext, useContext, useCallback, useState, useMemo, type ReactNode } from "react";
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

    // Memoize context value to prevent re-rendering ALL consumers
    // when only status/message change (which only affects the Toast component)
    const contextValue = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <Toast status={status} message={message} />
        </ToastContext.Provider>
    );
}

