import { NextRequest, NextResponse } from "next/server";

import {
    asNonEmptyString,
    badRequest,
    conflict,
    internalServerError,
    requireAdmin,
    revalidateQuestionsTag,
} from "../simulation-route-utils";

export async function GET(request: NextRequest) {
    try {
        const { supabase, errorResponse } = await requireAdmin();
        if (errorResponse) {
            return errorResponse;
        }

        const questionId = request.nextUrl.searchParams.get("questionId");
        if (!questionId) {
            return badRequest("questionId query param is required");
        }

        const { data, error } = await supabase
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
        const { supabase, errorResponse } = await requireAdmin();
        if (errorResponse) {
            return errorResponse;
        }

        const body = (await request.json()) as { question_id?: unknown };
        const questionId = asNonEmptyString(body.question_id);

        if (!questionId) {
            return badRequest("question_id is required");
        }

        const { data: existingTask, error: existingTaskError } = await supabase
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

        const { data, error } = await supabase
            .from("simulation_tasks")
            .insert({ question_id: questionId })
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
