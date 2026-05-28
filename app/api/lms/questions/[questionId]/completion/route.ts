import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { LMS_COURSES_TAG, LMS_CHAPTERS_TAG } from "@/lib/supabase/lms-cache-tags";
import { upsertUserXP, checkChapterCompletion, checkAccountingExplorer, checkAccountingMaster, recordContentXPEvent } from "@/lib/xp/service";

const VIDEO_DOC_XP = 15;

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
            .select("id, type, chapter_id")
            .eq("id", questionId)
            .maybeSingle<{ id: string; type: "question" | "video" | "document"; chapter_id: string }>();

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

        await upsertUserXP(supabaseAdmin, user.id, VIDEO_DOC_XP);

        if (question.chapter_id) {
            const { data: allQuestionsInChapter } = await supabaseAdmin
                .from("questions")
                .select("id, created_at")
                .eq("chapter_id", question.chapter_id)
                .order("created_at", { ascending: true });

            let topicNumber = 1;
            if (allQuestionsInChapter) {
                const currentIndex = allQuestionsInChapter.findIndex((q) => q.id === questionId);
                if (currentIndex !== -1) {
                    topicNumber = currentIndex + 1;
                }
            }

            await recordContentXPEvent(supabaseAdmin, user.id, questionId, question.chapter_id, topicNumber, VIDEO_DOC_XP);

            const { data: chapterData } = await supabaseAdmin
                .from("chapters")
                .select("id, course_id")
                .eq("id", question.chapter_id)
                .maybeSingle();

            if (chapterData) {
                await checkChapterCompletion(
                    supabaseAdmin,
                    user.id,
                    chapterData.id,
                    chapterData.course_id,
                );
                await checkAccountingExplorer(supabaseAdmin, user.id, chapterData.course_id);
                await checkAccountingMaster(supabaseAdmin, user.id, chapterData.course_id);
            }
        }

        // Always revalidate tags to ensure fresh data
        revalidateTag(LMS_CHAPTERS_TAG, "max");
        revalidateTag(LMS_COURSES_TAG, "max");

        return NextResponse.json({ success: true, questionId });
    } catch (error) {
        console.error("Failed to mark question as completed", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
