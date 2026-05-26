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
import { NextRequest, NextResponse } from "next/server";

const VALID_SIMULATOR_TYPES = [
    "none",
    "classification",
    "itr_registration",
    "epan_registration",
    "journal_entry",
    "ledger",
    "trial_balance",
    "financial_statement",
    "gstf-simulation",
] as const;

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const admin = await verifyAdminAccess(supabase);
        const faculty = await verifyFacultyAccess(supabase);
        if (!admin && !faculty) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const courseId = request.nextUrl.searchParams.get("courseId");
        if (!courseId) {
            return NextResponse.json({ error: "courseId query param is required" }, { status: 400 });
        }

        if (faculty?.role === "faculty") {
            const accessibleCourseIds = await getUserCourseAccess(supabase, faculty.id);
            if (!accessibleCourseIds.includes(courseId)) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const { data, error } = await supabase
            .from("chapters")
            .select("*")
            .eq("course_id", courseId)
            .order("sort_order", { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ chapters: data });
    } catch (error: unknown) {
        console.error("Error fetching chapters:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const admin = await verifyAdminAccess(supabase);
        const faculty = await verifyFacultyAccess(supabase);
        if (!admin && !faculty) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { course_id, title, slug, task_count, sort_order, is_active, simulator_type } = body;

        if (!course_id || !title || !slug) {
            return NextResponse.json({ error: "course_id, title, and slug are required" }, { status: 400 });
        }

        if (is_active !== undefined && typeof is_active !== "boolean") {
            return NextResponse.json({ error: "is_active must be a boolean" }, { status: 400 });
        }

        if (
            simulator_type !== undefined &&
            !VALID_SIMULATOR_TYPES.includes(simulator_type)
        ) {
            return NextResponse.json(
                { error: `simulator_type must be one of: ${VALID_SIMULATOR_TYPES.join(", ")}` },
                { status: 400 }
            );
        }

        if (faculty && faculty.role === "faculty") {
            const accessibleCourseIds = await getUserCourseAccess(supabase, faculty.id);
            if (!accessibleCourseIds.includes(course_id)) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const adminDb = createServiceRoleClient();
        const { data, error } = await adminDb
            .from("chapters")
            .insert({
                course_id,
                title,
                slug,
                task_count: task_count ?? 0,
                sort_order,
                is_active: is_active ?? true,
                simulator_type: simulator_type ?? "none",
            })
            .select()
            .maybeSingle();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: "Failed to create chapter" }, { status: 500 });
        }

        if (data?.course_id) {
            const { count: chapterCount } = await adminDb
                .from("chapters")
                .select("*", { count: "exact", head: true })
                .eq("course_id", data.course_id);

            await adminDb
                .from("courses")
                .update({ course_count: chapterCount ?? 0 })
                .eq("id", data.course_id);
        }

        revalidateTag(LMS_COURSES_TAG, "max");
        revalidateTag(LMS_CHAPTERS_TAG, "max");
        revalidateTag(LMS_QUESTIONS_TAG, "max");

        return NextResponse.json({ chapter: data }, { status: 201 });
    } catch (error: unknown) {
        console.error("Error creating chapter:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
