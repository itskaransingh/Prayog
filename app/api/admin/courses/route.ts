import { createClient } from "@/lib/supabase/server";
import { verifyAdminAccess } from "@/lib/supabase/admin-auth";
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
        if (!admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { data, error } = await supabase
            .from("courses")
            .select("*, chapters(count)")
            .order("created_at", { ascending: true });

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
        const { title, slug, course_count, icon_name, bg_color, text_color, is_active } = body;

        if (!title || !slug) {
            return NextResponse.json({ error: "title and slug are required" }, { status: 400 });
        }

        if (is_active !== undefined && typeof is_active !== "boolean") {
            return NextResponse.json({ error: "is_active must be a boolean" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("courses")
            .insert({
                title,
                slug,
                course_count,
                icon_name,
                bg_color,
                text_color,
                is_active: is_active ?? true,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
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
