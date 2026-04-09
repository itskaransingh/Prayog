import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getQuestionTypeLabel, type QuestionType } from "@/lib/questions/types";
import { createClient } from "@/lib/supabase/server";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ submoduleSlug: string }> },
) {
    try {
        const { submoduleSlug } = await params;
        const supabase = await createClient();
        const supabaseAdmin = createAdminClient();

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: submodule, error: submoduleError } = await supabaseAdmin
            .from("submodules")
            .select("id, title")
            .eq("slug", submoduleSlug)
            .eq("is_active", true)
            .single();

        if (submoduleError || !submodule) {
            return NextResponse.json(
                { error: "Submodule not found" },
                { status: 404 },
            );
        }

        const { data: questions, error: questionsError } = await supabaseAdmin
            .from("questions")
            .select("id, title, type")
            .eq("submodule_id", submodule.id)
            .order("created_at", { ascending: true });

        if (questionsError) {
            throw questionsError;
        }

        const questionIds = (questions ?? []).map((question) => question.id);
        let attemptedQuestionIds = new Set<string>();

        if (questionIds.length > 0) {
            const { data: attempts, error: attemptsError } = await supabaseAdmin
                .from("user_question_attempts")
                .select("question_id, user_simulation_attempts!attempt_id(user_id)")
                .in("question_id", questionIds)
                .eq("user_simulation_attempts.user_id", user.id);

            if (attemptsError) {
                throw attemptsError;
            }

            attemptedQuestionIds = new Set(
                (attempts ?? [])
                    .map((attempt) => attempt.question_id)
                    .filter((questionId): questionId is string => Boolean(questionId)),
            );
        }

        return NextResponse.json({
            submodule: {
                id: submodule.id,
                slug: submoduleSlug,
                title: submodule.title,
            },
            questions: (questions ?? []).map((question, index) => ({
                id: question.id,
                order: index + 1,
                title: question.title || `Question ${index + 1}`,
                type: getQuestionTypeLabel((question.type ?? "question") as QuestionType),
                attempted:
                    (question.type ?? "question") === "question" &&
                    attemptedQuestionIds.has(question.id),
            })),
        });
    } catch (error) {
        console.error("Failed to fetch learner question status", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
