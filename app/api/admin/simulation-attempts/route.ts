import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
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

        // 3. Fetch all simulation attempts using Admin Client to bypass RLS
        const supabaseAdmin = createAdminClient();
        
        // We fetch attempts without trying to join profiles since the FK points to auth.users
        const { data: attempts, error: fetchError } = await supabaseAdmin
            .from("user_simulation_attempts")
            .select(`
                id,
                user_id,
                task_id,
                total_score,
                max_possible_score,
                accuracy,
                created_at,
                simulation_tasks!task_id (
                    title,
                    questions!question_id (
                        title,
                        submodules!submodule_id (
                            title,
                            modules!module_id (
                                title
                            )
                        )
                    )
                )
            `)
            .order("created_at", { ascending: true });

        if (fetchError) {
            return NextResponse.json({ 
                error: fetchError.message, 
                details: fetchError.details,
                hint: fetchError.hint,
                code: fetchError.code
            }, { status: 500 });
        }

        // 4. Fetch profiles separately for the user IDs
        const userIds = Array.from(new Set((attempts || []).map(a => a.user_id).filter(Boolean)));
        let profileMap: Record<string, string> = {};
        
        if (userIds.length > 0) {
            const { data: profiles, error: profilesError } = await supabaseAdmin
                .from("profiles")
                .select("id, email")
                .in("id", userIds);
                
            if (!profilesError && profiles) {
                profiles.forEach(p => {
                    profileMap[p.id] = p.email || "Unknown";
                });
            }
        }

        // 5. Post-process to add attempt_number and flatten the structure
        const attemptCounts: Record<string, number> = {};
        const labeledAttempts = (attempts || []).map((attempt: any) => {
            const key = `${attempt.user_id}-${attempt.task_id}`;
            attemptCounts[key] = (attemptCounts[key] || 0) + 1;
            
            // Handle both object and array results from joins (Supabase can be inconsistent)
            const getFirst = (val: any) => Array.isArray(val) ? val[0] : val;
            
            const task = getFirst(attempt.simulation_tasks);
            const question = getFirst(task?.questions);
            const submodule = getFirst(question?.submodules);
            const module = getFirst(submodule?.modules);
            
            const email = attempt.user_id ? profileMap[attempt.user_id] : "Unknown";

            return {
                email: email || "Unknown",
                module_name: module?.title || "Unknown",
                submodule_name: submodule?.title || "Unknown",
                question_title: question?.title || "Unknown",
                total_score: attempt.total_score,
                max_possible_score: attempt.max_possible_score,
                accuracy: attempt.accuracy,
                created_at: attempt.created_at,
                attempt_number: attemptCounts[key]
            };
        });

        // 6. Return sorted by created_at DESC
        const sortedAttempts = labeledAttempts.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        return NextResponse.json({ 
            attempts: sortedAttempts,
            _count: attempts?.length || 0
        });
    } catch (error: any) {
        console.error("Simulation attempts fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
