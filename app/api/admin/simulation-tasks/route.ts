import { NextRequest, NextResponse } from "next/server";

import {
    asNonEmptyString,
    badRequest,
    conflict,
    internalServerError,
    requireAdmin,
    revalidateQuestionsTag,
} from "../simulation-route-utils";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
    try {
        const { errorResponse } = await requireAdmin();
        if (errorResponse) {
            return errorResponse;
        }
        const adminDb = createAdminClient();

        const questionId = request.nextUrl.searchParams.get("questionId");
        if (!questionId) {
            return badRequest("questionId query param is required");
        }

        const { data, error } = await adminDb
            .from("simulation_tasks")
            .select("*")
            .eq("question_id", questionId)
            .order("created_at", { ascending: true });

        if (error) {
            throw error;
        }

        return NextResponse.json({ tasks: data ?? [] });
    } catch (error: unknown) {
        return internalServerError("Error fetching simulation tasks:", error);
    }
}

export async function POST(request: Request) {
    try {
        const { errorResponse } = await requireAdmin();
        if (errorResponse) {
            return errorResponse;
        }
        const adminDb = createAdminClient();

        const body = (await request.json()) as {
            question_id?: unknown;
            show_expected_answers_in_evaluation?: unknown;
        };
        const questionId = asNonEmptyString(body.question_id);
        const showExpectedAnswersInEvaluation =
            typeof body.show_expected_answers_in_evaluation === "boolean"
                ? body.show_expected_answers_in_evaluation
                : false;

        if (!questionId) {
            return badRequest("question_id is required");
        }

        const { data: question, error: questionError } = await adminDb
            .from("questions")
            .select("id, title")
            .eq("id", questionId)
            .maybeSingle<{ id: string; title: string }>();

        if (questionError) {
            throw questionError;
        }

        if (!question) {
            return badRequest("question_id does not reference an existing question");
        }

        const { data: existingTask, error: existingTaskError } = await adminDb
            .from("simulation_tasks")
            .select("*")
            .eq("question_id", questionId)
            .limit(1)
            .maybeSingle();

        if (existingTaskError) {
            throw existingTaskError;
        }

        if (existingTask) {
            return conflict(
                "A simulation task already exists for this question",
                { task: existingTask }
            );
        }

        const { data, error } = await adminDb
            .from("simulation_tasks")
            .insert({
                question_id: questionId,
                title: question.title,
                description: `Simulation specific to ${question.title}`,
                max_score: 0,
                show_expected_answers_in_evaluation: showExpectedAnswersInEvaluation,
            })
            .select("*")
            .single();

        if (error) {
            throw error;
        }

        revalidateQuestionsTag();

        return NextResponse.json({ task: data }, { status: 201 });
    } catch (error: unknown) {
        return internalServerError("Error creating simulation task:", error);
    }
}
