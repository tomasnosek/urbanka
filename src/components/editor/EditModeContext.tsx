/* =============================================
   URBANKA — Edit Mode Context
   ============================================= */

"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

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

    return (
        <EditModeContext.Provider
            value={{
                isEditMode,
                toggleEditMode: () => setIsEditMode((prev) => !prev),
            }}
        >
            {children}
        </EditModeContext.Provider>
    );
}
