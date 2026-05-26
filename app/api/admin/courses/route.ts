import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
    verifyAdminAccess,
    verifyFacultyAccess,
    getUserCourseAccess,
} from "@/lib/supabase/admin-auth";
import {
    LMS_COURSES_TAG,
    LMS_QUESTIONS_TAG,
    LMS_CHAPTERS_TAG,
} from "../../../../lib/supabase/lms-cache-tags";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const admin = await verifyAdminAccess(supabase);
        const faculty = await verifyFacultyAccess(supabase);
        if (!admin && !faculty) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        let query = supabase
            .from("courses")
            .select("*, chapters(count)")
            .order("created_at", { ascending: true });

        if (admin?.role === "super_admin") {
            // super admins can see every course
        } else if (admin?.role === "admin") {
            query = query.eq("is_hidden", false);
        } else if (faculty) {
            const accessibleCourseIds = await getUserCourseAccess(supabase, faculty.id);
            if (accessibleCourseIds.length === 0) {
                return NextResponse.json({ courses: [] });
            }
            query = query.in("id", accessibleCourseIds).eq("is_hidden", false);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ courses: data });
    } catch (error: unknown) {
        console.error("Error fetching courses:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const admin = await verifyAdminAccess(supabase);
        if (!admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { title, slug, course_count, icon_name, bg_color, text_color, is_active, is_hidden } = body;

        if (!title || !slug) {
            return NextResponse.json({ error: "title and slug are required" }, { status: 400 });
        }

        if (is_active !== undefined && typeof is_active !== "boolean") {
            return NextResponse.json({ error: "is_active must be a boolean" }, { status: 400 });
        }

        if (is_hidden !== undefined && typeof is_hidden !== "boolean") {
            return NextResponse.json({ error: "is_hidden must be a boolean" }, { status: 400 });
        }

        const adminDb = createServiceRoleClient();
        const { data, error } = await adminDb
            .from("courses")
            .insert({
                title,
                slug,
                course_count,
                icon_name,
                bg_color,
                text_color,
                is_active: is_active ?? true,
                is_hidden: is_hidden ?? false,
            })
            .select()
            .maybeSingle();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
        }

        revalidateTag(LMS_COURSES_TAG, "max");
        revalidateTag(LMS_CHAPTERS_TAG, "max");
        revalidateTag(LMS_QUESTIONS_TAG, "max");

        return NextResponse.json({ course: data }, { status: 201 });
    } catch (error: unknown) {
        console.error("Error creating course:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
