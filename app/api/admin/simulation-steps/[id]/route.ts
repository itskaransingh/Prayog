import { NextResponse } from "next/server";

import {
    asNonEmptyString,
    asOptionalNumber,
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

        const body = (await request.json()) as {
            task_id?: unknown;
            step_order?: unknown;
        };
        const updateData: { task_id?: string; step_order?: number } = {};

        if (body.task_id !== undefined) {
            const taskId = asNonEmptyString(body.task_id);
            if (!taskId) {
                return badRequest("task_id must be a non-empty string");
            }
            updateData.task_id = taskId;
        }

        if (body.step_order !== undefined) {
            const stepOrder = asOptionalNumber(body.step_order);
            if (stepOrder === undefined) {
                return badRequest("step_order must be a number");
            }
            updateData.step_order = stepOrder;
        }

        if (Object.keys(updateData).length === 0) {
            return badRequest("No fields to update");
        }

        const { data, error } = await supabase
            .from("simulation_steps")
            .update(updateData)
            .eq("id", id)
            .select("*")
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return notFound("Simulation step not found");
        }

        revalidateQuestionsTag();

        return NextResponse.json({ step: data });
    } catch (error: unknown) {
        return internalServerError("Error updating simulation step:", error);
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

        const { error: deleteFieldsError } = await supabase
            .from("simulation_fields")
            .delete()
            .eq("step_id", id);

        if (deleteFieldsError) {
            throw deleteFieldsError;
        }

        const { data, error } = await supabase
            .from("simulation_steps")
            .delete()
            .eq("id", id)
            .select("*")
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return notFound("Simulation step not found");
        }

        revalidateQuestionsTag();

        return NextResponse.json({ step: data });
    } catch (error: unknown) {
        return internalServerError("Error deleting simulation step:", error);
    }
}
