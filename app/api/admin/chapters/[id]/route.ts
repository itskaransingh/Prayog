import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { verifyAdminAccess } from "@/lib/supabase/admin-auth";
import {
    LMS_COURSES_TAG,
    LMS_QUESTIONS_TAG,
    LMS_CHAPTERS_TAG,
} from "../../../../../lib/supabase/lms-cache-tags";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

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
        const { title, slug, task_count, progress, sort_order, is_active, simulator_type } = body;

        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData.title = title;
        if (slug !== undefined) updateData.slug = slug;
        if (task_count !== undefined) updateData.task_count = task_count;
        if (progress !== undefined) updateData.progress = progress;
        if (sort_order !== undefined) updateData.sort_order = sort_order;

        if (is_active !== undefined) {
            if (typeof is_active !== "boolean") {
                return NextResponse.json({ error: "is_active must be a boolean" }, { status: 400 });
            }
            updateData.is_active = is_active;
        }

        if (simulator_type !== undefined) {
            if (!VALID_SIMULATOR_TYPES.includes(simulator_type)) {
                return NextResponse.json(
                    { error: `simulator_type must be one of: ${VALID_SIMULATOR_TYPES.join(", ")}` },
                    { status: 400 }
                );
            }
            updateData.simulator_type = simulator_type;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 });
        }

        const adminDb = createServiceRoleClient();
        const { data, error } = await adminDb
            .from("chapters")
            .update(updateData)
            .eq("id", id)
            .select()
            .maybeSingle();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data) {
            return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
        }

        revalidateTag(LMS_COURSES_TAG, "max");
        revalidateTag(LMS_CHAPTERS_TAG, "max");
        revalidateTag(LMS_QUESTIONS_TAG, "max");

        return NextResponse.json({ chapter: data });
    } catch (error: unknown) {
        console.error("Error updating chapter:", error);
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

        const adminDb = createServiceRoleClient();
        const { data: chapter } = await adminDb
            .from("chapters")
            .select("course_id")
            .eq("id", id)
            .single();

        const { error } = await adminDb
            .from("chapters")
            .delete()
            .eq("id", id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (chapter?.course_id) {
            const { count: chapterCount } = await adminDb
                .from("chapters")
                .select("*", { count: "exact", head: true })
                .eq("course_id", chapter.course_id);

            await adminDb
                .from("courses")
                .update({ course_count: chapterCount ?? 0 })
                .eq("id", chapter.course_id);
        }

        revalidateTag(LMS_COURSES_TAG, "max");
        revalidateTag(LMS_CHAPTERS_TAG, "max");
        revalidateTag(LMS_QUESTIONS_TAG, "max");

        return NextResponse.json({ message: "Chapter deleted" });
    } catch (error: unknown) {
        console.error("Error deleting chapter:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
