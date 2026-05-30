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

        const { data: { user: requester }, error: authError } = await supabase.auth.getUser();
        if (authError || !requester) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", requester.id)
            .single();

        if (profileError || !profile || (profile.role !== "super_admin" && profile.role !== "admin" && profile.role !== "faculty")) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const url = new URL(request.url);
        const courseId = url.searchParams.get("courseId");

        const supabaseAdmin = createAdminClient();

        let users;
        if (profile.role === "super_admin") {
            let query = supabaseAdmin
                .from("profiles")
                .select("id, email, full_name, role, created_at")
                .order("created_at", { ascending: false });

            if (courseId) {
                const { data: access } = await supabaseAdmin
                    .from("user_course_access")
                    .select("user_id")
                    .eq("course_id", courseId);
                const userIds = access?.map((a) => a.user_id) || [];
                if (userIds.length > 0) {
                    query = query.in("id", userIds);
                }
            }

            const { data, error: fetchError } = await query;

            if (fetchError) {
                return NextResponse.json({ error: fetchError.message }, { status: 500 });
            }
            users = data;
        } else {
            const { data: courseAccess } = await supabaseAdmin
                .from("user_course_access")
                .select("course_id")
                .eq("user_id", requester.id);

            const accessibleCourseIds = courseAccess?.map((a) => a.course_id) || [];

            if (accessibleCourseIds.length === 0) {
                return NextResponse.json({ users: [] });
            }

            const { data: usersInCourses } = await supabaseAdmin
                .from("user_course_access")
                .select("user_id")
                .in("course_id", accessibleCourseIds);

            const userIdsInCourses = new Set((usersInCourses ?? []).map((a) => a.user_id));
            userIdsInCourses.add(requester.id);

            const { data: createdUsers } = await supabaseAdmin
                .from("profiles")
                .select("id")
                .order("created_at", { ascending: false });

            const createdUserIds = new Set((createdUsers ?? []).map((u) => u.id));

            const allUserIds = new Set([...userIdsInCourses, ...createdUserIds]);

            let query = supabaseAdmin
                .from("profiles")
                .select("id, email, full_name, role, created_at")
                .in("id", Array.from(allUserIds))
                .order("created_at", { ascending: false });

            if (courseId) {
                const { data: access } = await supabaseAdmin
                    .from("user_course_access")
                    .select("user_id")
                    .eq("course_id", courseId);
                const userIdsWithAccess = access?.map((a) => a.user_id) || [];
                if (userIdsWithAccess.length > 0) {
                    const filteredIds = Array.from(allUserIds).filter(id => userIdsWithAccess.includes(id));
                    query = query.in("id", filteredIds);
                } else {
                    return NextResponse.json({ users: [] });
                }
            }

            const { data: usersData, error: fetchError } = await query;

            if (fetchError) {
                return NextResponse.json({ error: fetchError.message }, { status: 500 });
            }
            users = usersData;
        }

        return NextResponse.json({ users });
    } catch (error: unknown) {
        console.error("Users fetch error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
