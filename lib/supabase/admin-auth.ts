import { createClient } from "@/lib/supabase/server";

export async function verifyAdminAccess(
    supabase: Awaited<ReturnType<typeof createClient>>
) {
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return null;
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== "admin") {
        return null;
    }

    return user;
}
