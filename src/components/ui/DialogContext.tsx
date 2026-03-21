"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { ConfirmDialog } from "./ConfirmDialog";

interface ConfirmOptions {
    title: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

interface DialogContextValue {
    showConfirm: (options: ConfirmOptions) => void;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export function useDialog() {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error("useDialog must be used within a DialogProvider");
    }
    return context;
}

export function DialogProvider({ children }: { children: ReactNode }) {
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        options: ConfirmOptions | null;
    }>({
        isOpen: false,
        options: null,
    });

    const showConfirm = useCallback((options: ConfirmOptions) => {
        setConfirmState({
            isOpen: true,
            options,
        });
    }, []);

    const handleConfirm = useCallback(() => {
        if (confirmState.options?.onConfirm) {
            confirmState.options.onConfirm();
        }
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
    }, [confirmState.options]);

    const handleCancel = useCallback(() => {
        if (confirmState.options?.onCancel) {
            confirmState.options.onCancel();
        }
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
    }, [confirmState.options]);

    return (
        <DialogContext.Provider value={{ showConfirm }}>
            {children}
            {confirmState.options && (
                <ConfirmDialog
                    isOpen={confirmState.isOpen}
                    title={confirmState.options.title}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    confirmText={confirmState.options.confirmText}
                    cancelText={confirmState.options.cancelText}
                />
            )}
        </DialogContext.Provider>
    );
}
