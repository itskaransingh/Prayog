import { createClient } from "@/lib/supabase/server";

export type UserRole = "super_admin" | "admin" | "faculty" | "student";

export interface AuthenticatedUser {
    id: string;
    email: string;
    role: UserRole;
}

export async function getCurrentUser(
    supabase: Awaited<ReturnType<typeof createClient>>
): Promise<AuthenticatedUser | null> {
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

    if (!profile || !isValidRole(profile.role)) {
        return null;
    }

    return {
        id: user.id,
        email: user.email || "",
        role: profile.role as UserRole,
    };
}

function isValidRole(role: string): role is UserRole {
    return ["super_admin", "admin", "faculty", "student"].includes(role);
}

export async function verifyAdminAccess(
    supabase: Awaited<ReturnType<typeof createClient>>
): Promise<AuthenticatedUser | null> {
    const user = await getCurrentUser(supabase);
    if (!user) return null;
    if (user.role !== "super_admin" && user.role !== "admin") return null;
    return user;
}

export async function verifyFacultyAccess(
    supabase: Awaited<ReturnType<typeof createClient>>
): Promise<AuthenticatedUser | null> {
    const user = await getCurrentUser(supabase);
    if (!user) return null;
    if (user.role !== "super_admin" && user.role !== "admin" && user.role !== "faculty") return null;
    return user;
}

export async function verifyDashboardAccess(
    supabase: Awaited<ReturnType<typeof createClient>>
): Promise<AuthenticatedUser | null> {
    const user = await getCurrentUser(supabase);
    if (!user) return null;
    if (user.role === "student") return null;
    return user;
}

export async function getUserCourseAccess(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string
): Promise<string[]> {
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

    if (profile?.role === "super_admin") {
        const { data: courses } = await supabase
            .from("courses")
            .select("id")
            .eq("is_active", true);
        return courses?.map((c) => c.id) || [];
    }

    const { data: access } = await supabase
        .from("user_course_access")
        .select("course_id")
        .eq("user_id", userId);

    return access?.map((a) => a.course_id) || [];
}

export async function verifyCourseAccess(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    courseId: string
): Promise<boolean> {
    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

    if (profile?.role === "super_admin") return true;

    const { data: access } = await supabase
        .from("user_course_access")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .single();

    return !!access;
}
