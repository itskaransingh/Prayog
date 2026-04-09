import { NextResponse } from "next/server";

import {
    asNonEmptyString,
    badRequest,
    internalServerError,
    notFound,
    requireAdmin,
    revalidateQuestionsTag,
} from "../../simulation-route-utils";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { errorResponse } = await requireAdmin();
        if (errorResponse) {
            return errorResponse;
        }
        const adminDb = createAdminClient();

        const body = (await request.json()) as {
            question_id?: unknown;
            show_expected_answers_in_evaluation?: unknown;
        };
        const updateData: {
            question_id?: string;
            show_expected_answers_in_evaluation?: boolean;
        } = {};

        if (body.question_id !== undefined) {
            const questionId = asNonEmptyString(body.question_id);
            if (!questionId) {
                return badRequest("question_id must be a non-empty string");
            }

            const { data: existingTask, error: existingTaskError } = await adminDb
                .from("simulation_tasks")
                .select("id")
                .eq("question_id", questionId)
                .neq("id", id)
                .limit(1)
                .maybeSingle();

            if (existingTaskError) {
                throw existingTaskError;
            }

            if (existingTask) {
                return NextResponse.json(
                    { error: "Another simulation task already exists for this question" },
                    { status: 409 }
                );
            }

            updateData.question_id = questionId;
        }

        if (body.show_expected_answers_in_evaluation !== undefined) {
            if (typeof body.show_expected_answers_in_evaluation !== "boolean") {
                return badRequest(
                    "show_expected_answers_in_evaluation must be a boolean",
                );
            }

            updateData.show_expected_answers_in_evaluation =
                body.show_expected_answers_in_evaluation;
        }

        if (Object.keys(updateData).length === 0) {
            return badRequest("No fields to update");
        }

        const { data, error } = await adminDb
            .from("simulation_tasks")
            .update(updateData)
            .eq("id", id)
            .select("*")
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return notFound("Simulation task not found");
        }

        revalidateQuestionsTag();

        return NextResponse.json({ task: data });
    } catch (error: unknown) {
        return internalServerError("Error updating simulation task:", error);
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { errorResponse } = await requireAdmin();
        if (errorResponse) {
            return errorResponse;
        }
        const adminDb = createAdminClient();

        const { data: steps, error: stepsError } = await adminDb
            .from("simulation_steps")
            .select("id")
            .eq("task_id", id);

        if (stepsError) {
            throw stepsError;
        }

        const stepIds = (steps ?? []).map((step) => step.id);
        if (stepIds.length > 0) {
            const { error: fieldsError } = await adminDb
                .from("simulation_fields")
                .delete()
                .in("step_id", stepIds);

            if (fieldsError) {
                throw fieldsError;
            }

            const { error: deleteStepsError } = await adminDb
                .from("simulation_steps")
                .delete()
                .eq("task_id", id);

            if (deleteStepsError) {
                throw deleteStepsError;
            }
        }

        const { data, error } = await adminDb
            .from("simulation_tasks")
            .delete()
            .eq("id", id)
            .select("*")
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return notFound("Simulation task not found");
        }

        revalidateQuestionsTag();

        return NextResponse.json({ task: data });
    } catch (error: unknown) {
        return internalServerError("Error deleting simulation task:", error);
    }
}
