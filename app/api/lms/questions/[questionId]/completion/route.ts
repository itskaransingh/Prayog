import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { LMS_MODULES_TAG, LMS_SUBMODULES_TAG } from "@/lib/supabase/lms-cache-tags";

export async function POST(
    _request: Request,
    { params }: { params: Promise<{ questionId: string }> },
) {
    try {
        const { questionId } = await params;
        const supabase = await createClient();
        const supabaseAdmin = createAdminClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: question, error: questionError } = await supabaseAdmin
            .from("questions")
            .select("id, type, submodule_id")
            .eq("id", questionId)
            .maybeSingle<{ id: string; type: "question" | "video" | "document"; submodule_id: string }>();

        if (questionError) {
            throw questionError;
        }

        if (!question || question.type === "question") {
            return NextResponse.json(
                { error: "Only video and document resources can be marked as completed" },
                { status: 400 },
            );
        }

        const { error: upsertError } = await supabaseAdmin
            .from("user_question_completions")
            .upsert(
                {
                    user_id: user.id,
                    question_id: questionId,
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "user_id,question_id",
                },
            );

        if (upsertError) {
            throw upsertError;
        }

        // Always revalidate tags to ensure fresh data
        revalidateTag(LMS_SUBMODULES_TAG, "max");
        revalidateTag(LMS_MODULES_TAG, "max");

        return NextResponse.json({ success: true, questionId });
    } catch (error) {
        console.error("Failed to mark question as completed", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
