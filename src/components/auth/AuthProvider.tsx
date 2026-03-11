/* =============================================
   URBANKA — Auth Provider (client-side context)
   ============================================= */

"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from "react";
import { createBrowserSupabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
    user: User | null;
    isAdmin: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ error?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAdmin: false,
    isLoading: true,
    login: async () => ({}),
    logout: async () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = createBrowserSupabase();

    useEffect(() => {
        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const login = useCallback(
        async (email: string, password: string) => {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) return { error: error.message };
            return {};
        },
        [supabase.auth]
    );

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
    }, [supabase.auth]);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAdmin: !!user,
                isLoading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
