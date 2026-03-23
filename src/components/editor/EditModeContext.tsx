/* =============================================
   URBANKA — Edit Mode Context
   ============================================= */

"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

interface EditModeContextType {
    isEditMode: boolean;
    toggleEditMode: () => void;
}

const EditModeContext = createContext<EditModeContextType>({
    isEditMode: false,
    toggleEditMode: () => { },
});

export function useEditMode() {
    return useContext(EditModeContext);
}

export function EditModeProvider({ children }: { children: ReactNode }) {
    const [isEditMode, setIsEditMode] = useState(false);
    const { isAdmin } = useAuth();

    return (
        <EditModeContext.Provider
            value={{
                isEditMode: isEditMode && isAdmin,
                toggleEditMode: () => {
                    if (isAdmin) {
                        setIsEditMode((prev) => !prev);
                    }
                },
            }}
        >
            {children}
        </EditModeContext.Provider>
    );
}
