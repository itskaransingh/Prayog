import { verifyAdminAccess } from "@/lib/supabase/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    LMS_MODULES_TAG,
    LMS_QUESTIONS_TAG,
    LMS_SUBMODULES_TAG,
} from "../../../../lib/supabase/lms-cache-tags";
import { createClient } from "@/lib/supabase/server";
import { isQuestionType } from "@/lib/questions/types";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_COURSE_OBJECTIVES = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"] as const;

function parseCourseObjectives(value: unknown): string[] | null {
    if (value === undefined) {
        return [];
    }

    if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
        return null;
    }

    const normalized = value
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean);

    const unique = Array.from(new Set(normalized));
    return unique.every((item) => ALLOWED_COURSE_OBJECTIVES.includes(item as (typeof ALLOWED_COURSE_OBJECTIVES)[number]))
        ? unique
        : null;
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const admin = await verifyAdminAccess(supabase);
        const adminDb = createAdminClient();

        if (!admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const submoduleId = request.nextUrl.searchParams.get("submoduleId");
        if (!submoduleId) {
            return NextResponse.json(
                { error: "submoduleId query param is required" },
                { status: 400 }
            );
        }

        const { data, error } = await adminDb
            .from("questions")
            .select("*")
            .eq("submodule_id", submoduleId)
            .order("created_at", { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ questions: data });
    } catch (error: unknown) {
        console.error("Error fetching questions:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const admin = await verifyAdminAccess(supabase);
        const adminDb = createAdminClient();

        if (!admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const {
            submodule_id,
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

        if (!submodule_id || !title) {
            return NextResponse.json(
                { error: "submodule_id and title are required" },
                { status: 400 }
            );
        }

        if (type !== undefined && !isQuestionType(type)) {
            return NextResponse.json(
                { error: "type must be one of: question, video, document" },
                { status: 400 }
            );
        }

        const normalizedCourseObjectives = parseCourseObjectives(course_objectives);
        if (normalizedCourseObjectives === null) {
            return NextResponse.json(
                { error: "course_objectives must be an array containing only CO1 to CO6" },
                { status: 400 }
            );
        }

        const normalizedType = isQuestionType(type) ? type : "question";
        const normalizedHasTable = normalizedType === "question" ? Boolean(has_table) : false;
        const normalizedHasImage = normalizedType === "question" ? Boolean(has_image) : false;
        const normalizedContentHtml =
            typeof content_html === "string"
                ? content_html
                : typeof paragraph === "string"
                  ? paragraph
                  : typeof resource_description === "string"
                    ? resource_description
                    : "";

        const { data, error } = await adminDb
            .from("questions")
            .insert({
                submodule_id,
                title,
                paragraph: paragraph ?? "",
                content_html: normalizedContentHtml,
                upper_body_html: typeof upper_body_html === "string" ? upper_body_html : null,
                lower_body_html: typeof lower_body_html === "string" ? lower_body_html : null,
                has_table: normalizedHasTable,
                table_data: normalizedHasTable ? table_data : null,
                has_image: normalizedHasImage,
                image_url: normalizedHasImage ? image_url : null,
                type: normalizedType,
                resource_description: resource_description ?? null,
                course_objectives: normalizedCourseObjectives,
                video_url: normalizedType === "video" ? video_url ?? null : null,
                link_url: normalizedType === "document" ? link_url ?? null : null,
                link_title: normalizedType === "document" ? link_title ?? null : null,
            })
            .select("*")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Recalculate task_count for the submodule
        const { count: taskCount } = await adminDb
            .from("questions")
            .select("*", { count: "exact", head: true })
            .eq("submodule_id", submodule_id);

        await adminDb
            .from("submodules")
            .update({ task_count: taskCount ?? 0 })
            .eq("id", submodule_id);

        revalidateTag(LMS_MODULES_TAG, "max");
        revalidateTag(LMS_SUBMODULES_TAG, "max");
        revalidateTag(LMS_QUESTIONS_TAG, "max");

        return NextResponse.json({ question: data }, { status: 201 });
    } catch (error: unknown) {
        console.error("Error creating question:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
