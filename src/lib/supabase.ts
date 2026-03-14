/* =============================================
   URBANKA — Supabase Client
   ============================================= */

import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

/* --- Browser client (for client components) --- */
export function createBrowserSupabase() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
    );
}

