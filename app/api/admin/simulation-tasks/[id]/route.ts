import { NextResponse } from "next/server";

import {
    asNonEmptyString,
    badRequest,
    internalServerError,
    notFound,
    requireAdmin,
    revalidateQuestionsTag,
} from "../../simulation-route-utils";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { supabase, errorResponse } = await requireAdmin();
        if (errorResponse) {
            return errorResponse;
        }

        const body = (await request.json()) as { question_id?: unknown };
        const updateData: { question_id?: string } = {};

        if (body.question_id !== undefined) {
            const questionId = asNonEmptyString(body.question_id);
            if (!questionId) {
                return badRequest("question_id must be a non-empty string");
            }

            const { data: existingTask, error: existingTaskError } = await supabase
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

        if (Object.keys(updateData).length === 0) {
            return badRequest("No fields to update");
        }

        const { data, error } = await supabase
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
        const { supabase, errorResponse } = await requireAdmin();
        if (errorResponse) {
            return errorResponse;
        }

        const { data: steps, error: stepsError } = await supabase
            .from("simulation_steps")
            .select("id")
            .eq("task_id", id);

        if (stepsError) {
            throw stepsError;
        }

        const stepIds = (steps ?? []).map((step) => step.id);
        if (stepIds.length > 0) {
            const { error: fieldsError } = await supabase
                .from("simulation_fields")
                .delete()
                .in("step_id", stepIds);

            if (fieldsError) {
                throw fieldsError;
            }

            const { error: deleteStepsError } = await supabase
                .from("simulation_steps")
                .delete()
                .eq("task_id", id);

            if (deleteStepsError) {
                throw deleteStepsError;
            }
        }

        const { data, error } = await supabase
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
