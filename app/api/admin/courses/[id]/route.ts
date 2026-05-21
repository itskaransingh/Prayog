import { createClient } from "@/lib/supabase/server";
import { verifyAdminAccess } from "@/lib/supabase/admin-auth";
import {
    LMS_COURSES_TAG,
    LMS_QUESTIONS_TAG,
    LMS_CHAPTERS_TAG,
} from "../../../../../lib/supabase/lms-cache-tags";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const admin = await verifyAdminAccess(supabase);
        if (!admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const {
            title,
            slug,
            course_count,
            icon_name,
            bg_color,
            text_color,
            progress,
            is_active,
        } = body;

        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData.title = title;
        if (slug !== undefined) updateData.slug = slug;
        if (course_count !== undefined) updateData.course_count = course_count;
        if (icon_name !== undefined) updateData.icon_name = icon_name;
        if (bg_color !== undefined) updateData.bg_color = bg_color;
        if (text_color !== undefined) updateData.text_color = text_color;
        if (progress !== undefined) updateData.progress = progress;

        if (is_active !== undefined) {
            if (typeof is_active !== "boolean") {
                return NextResponse.json({ error: "is_active must be a boolean" }, { status: 400 });
            }
            updateData.is_active = is_active;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("courses")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        revalidateTag(LMS_COURSES_TAG, "max");
        revalidateTag(LMS_CHAPTERS_TAG, "max");
        revalidateTag(LMS_QUESTIONS_TAG, "max");

        return NextResponse.json({ course: data });
    } catch (error: unknown) {
        console.error("Error updating course:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const admin = await verifyAdminAccess(supabase);
        if (!admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { error } = await supabase
            .from("courses")
            .delete()
            .eq("id", id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        revalidateTag(LMS_COURSES_TAG, "max");
        revalidateTag(LMS_CHAPTERS_TAG, "max");
        revalidateTag(LMS_QUESTIONS_TAG, "max");

        return NextResponse.json({ message: "Course deleted" });
    } catch (error: unknown) {
        console.error("Error deleting course:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
