import { verifyAdminAccess } from "@/lib/supabase/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    LMS_MODULES_TAG,
    LMS_QUESTIONS_TAG,
    LMS_SUBMODULES_TAG,
} from "../../../../../lib/supabase/lms-cache-tags";
import { createClient } from "@/lib/supabase/server";
import { isQuestionType } from "@/lib/questions/types";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

const ALLOWED_COURSE_OBJECTIVES = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"] as const;

function parseCourseObjectives(value: unknown): string[] | null {
    if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
        return null;
    }

    const normalized = value
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean);

    const unique = Array.from(new Set(normalized));
    return unique.every((item) =>
        ALLOWED_COURSE_OBJECTIVES.includes(
            item as (typeof ALLOWED_COURSE_OBJECTIVES)[number],
        ),
    )
        ? unique
        : null;
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const admin = await verifyAdminAccess(supabase);
        const adminDb = createAdminClient();

        if (!admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const {
            title,
            paragraph,
            content_html,
            upper_body_html,
            lower_body_html,
            has_table,
            table_data,
            has_image,
            image_url,
            type,
            resource_description,
            course_objectives,
            video_url,
            link_url,
            link_title,
        } = body;

        const updateData: Record<string, unknown> = {};
        const normalizedType = type === undefined
            ? undefined
            : isQuestionType(type)
            ? type
            : null;

        if (type !== undefined && normalizedType === null) {
            return NextResponse.json(
                { error: "type must be one of: question, video, document" },
                { status: 400 }
            );
        }

        if (normalizedType !== undefined) {
            updateData.type = normalizedType;
        }
        if (title !== undefined) updateData.title = title;
        if (paragraph !== undefined) updateData.paragraph = paragraph;
        if (content_html !== undefined) updateData.content_html = content_html;
        if (upper_body_html !== undefined) updateData.upper_body_html = upper_body_html;
        if (lower_body_html !== undefined) updateData.lower_body_html = lower_body_html;
        if (resource_description !== undefined) {
            updateData.resource_description = resource_description;
        }
        if (course_objectives !== undefined) {
            const normalizedCourseObjectives = parseCourseObjectives(course_objectives);
            if (normalizedCourseObjectives === null) {
                return NextResponse.json(
                    {
                        error: "course_objectives must be an array containing only CO1 to CO6",
                    },
                    { status: 400 },
                );
            }

            updateData.course_objectives = normalizedCourseObjectives;
        }
        if (has_table !== undefined) updateData.has_table = has_table;
        if (table_data !== undefined || has_table === false) {
            updateData.table_data = has_table === false ? null : table_data;
        }
        if (has_image !== undefined) updateData.has_image = has_image;
        if (image_url !== undefined || has_image === false) {
            updateData.image_url = has_image === false ? null : image_url;
        }
        if (video_url !== undefined) updateData.video_url = video_url;
        if (link_url !== undefined) updateData.link_url = link_url;
        if (link_title !== undefined) updateData.link_title = link_title;

        if (normalizedType === "question") {
            updateData.video_url = null;
            updateData.link_url = null;
            updateData.link_title = null;
        }

        if (normalizedType === "video") {
            updateData.has_table = false;
            updateData.table_data = null;
            updateData.has_image = false;
            updateData.image_url = null;
            updateData.link_url = null;
            updateData.link_title = null;
        }

        if (normalizedType === "document") {
            updateData.has_table = false;
            updateData.table_data = null;
            updateData.has_image = false;
            updateData.image_url = null;
            updateData.video_url = null;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: "No fields to update" },
                { status: 400 }
            );
        }

        const { data, error } = await adminDb
            .from("questions")
            .update(updateData)
            .eq("id", id)
            .select("*")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Recalculate task_count if type changed
        if (data?.submodule_id && normalizedType !== undefined) {
            const { count: taskCount } = await adminDb
                .from("questions")
                .select("*", { count: "exact", head: true })
                .eq("submodule_id", data.submodule_id);

            await adminDb
                .from("submodules")
                .update({ task_count: taskCount ?? 0 })
                .eq("id", data.submodule_id);
        }

        revalidateTag(LMS_MODULES_TAG, "max");
        revalidateTag(LMS_SUBMODULES_TAG, "max");
        revalidateTag(LMS_QUESTIONS_TAG, "max");

        return NextResponse.json({ question: data });
    } catch (error: unknown) {
        console.error("Error updating question:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
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
        const adminDb = createAdminClient();

        if (!admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get submodule_id before deleting
        const { data: question } = await adminDb
            .from("questions")
            .select("submodule_id")
            .eq("id", id)
            .single();

        const { error } = await adminDb.from("questions").delete().eq("id", id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Recalculate task_count for the submodule
        if (question?.submodule_id) {
            const { count: taskCount } = await adminDb
                .from("questions")
                .select("*", { count: "exact", head: true })
                .eq("submodule_id", question.submodule_id);

            await adminDb
                .from("submodules")
                .update({ task_count: taskCount ?? 0 })
                .eq("id", question.submodule_id);
        }

        revalidateTag(LMS_MODULES_TAG, "max");
        revalidateTag(LMS_SUBMODULES_TAG, "max");
        revalidateTag(LMS_QUESTIONS_TAG, "max");

        return NextResponse.json({ message: "Question deleted" });
    } catch (error: unknown) {
        console.error("Error deleting question:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
