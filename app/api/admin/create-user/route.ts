import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const VALID_ROLES = ["super_admin", "admin", "faculty", "student"] as const;
type ValidRole = (typeof VALID_ROLES)[number];

function deriveFullName(email: string) {
    return email.split("@")[0]?.trim() || email.trim();
}

export async function POST(request: Request) {
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
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
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

        if (profileError || !profile || !VALID_ROLES.includes(profile.role as ValidRole)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const requesterRole = profile.role as ValidRole;

        const { email, password, role, fullName, courseAccess } = await request.json();

        if (!email || !password || !role) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!VALID_ROLES.includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        if (requesterRole === "admin" && (role === "admin" || role === "super_admin")) {
            return NextResponse.json(
                { error: "Admins can only create faculty or student users" },
                { status: 403 }
            );
        }

        if (requesterRole === "faculty") {
            return NextResponse.json(
                { error: "Faculty cannot create users" },
                { status: 403 }
            );
        }

        const normalizedFullName = (typeof fullName === "string" ? fullName.trim() : "") || deriveFullName(email);

        const supabaseAdmin = createAdminClient();
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (createError) {
            return NextResponse.json({ error: createError.message }, { status: 500 });
        }

        if (!newUser.user) {
            return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
        }

        const { error: insertError } = await supabaseAdmin
            .from("profiles")
            .insert({
                id: newUser.user.id,
                email: newUser.user.email,
                full_name: normalizedFullName,
                role: role,
            });

        if (insertError) {
            return NextResponse.json({ error: `User created but profile insertion failed: ${insertError.message}` }, { status: 500 });
        }

        if (role === "admin") {
            const { data: allCourses } = await supabaseAdmin
                .from("courses")
                .select("id");

            if (allCourses && allCourses.length > 0) {
                const accessRows = allCourses.map((course: { id: string }) => ({
                    user_id: newUser.user.id,
                    course_id: course.id,
                }));

                const { error: accessError } = await supabaseAdmin
                    .from("user_course_access")
                    .insert(accessRows);

                if (accessError) {
                    console.error("Failed to insert course access for admin:", accessError);
                }
            }
        } else if (role !== "super_admin" && Array.isArray(courseAccess) && courseAccess.length > 0) {
            let accessibleCourseIds = courseAccess;

            if (requesterRole === "admin") {
                const { data: requesterAccess } = await supabaseAdmin
                    .from("user_course_access")
                    .select("course_id")
                    .eq("user_id", requester.id);

                const requesterCourseIds = new Set((requesterAccess ?? []).map((a) => a.course_id));
                accessibleCourseIds = courseAccess.filter((id: string) => requesterCourseIds.has(id));
            }

            if (accessibleCourseIds.length > 0) {
                const accessRows = accessibleCourseIds.map((courseId: string) => ({
                    user_id: newUser.user.id,
                    course_id: courseId,
                }));

                const { error: accessError } = await supabaseAdmin
                    .from("user_course_access")
                    .insert(accessRows);

                if (accessError) {
                    console.error("Failed to insert course access:", accessError);
                }
            }
        }

        return NextResponse.json({ message: "User created successfully", user: newUser.user });
    } catch (error: unknown) {
        console.error("User creation error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
