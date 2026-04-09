import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // Ignored
                        }
                    },
                },
            }
        );

        // 1. Check if the requester is authenticated
        const { data: { user: requester }, error: authError } = await supabase.auth.getUser();
        if (authError || !requester) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Check if the requester is an admin
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", requester.id)
            .single();

        if (profileError || !profile || profile.role !== "admin") {
            return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
        }

        // 3. Fetch all users using Admin Client to bypass RLS
        const supabaseAdmin = createAdminClient();
        const { data: users, error: fetchError } = await supabaseAdmin
            .from("profiles")
            .select("id, email, full_name, role, created_at")
            .order("created_at", { ascending: false });

        if (fetchError) {
            return NextResponse.json({ error: fetchError.message }, { status: 500 });
        }

        return NextResponse.json({ users });
    } catch (error: unknown) {
        console.error("Users fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
