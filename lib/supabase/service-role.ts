import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client using the service role key.
 * For server-side use only — never expose this to the browser.
 */
export const createServiceRoleClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        }
    );
};
