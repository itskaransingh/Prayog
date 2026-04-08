import { NextRequest, NextResponse } from "next/server";

import {
    asNonEmptyString,
    asOptionalNumber,
    badRequest,
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

        const taskId = request.nextUrl.searchParams.get("taskId");
        if (!taskId) {
            return badRequest("taskId query param is required");
        }

        const { data, error } = await supabase
            .from("simulation_steps")
            .select("*")
            .eq("task_id", taskId)
            .order("step_order", { ascending: true });

        if (error) {
            throw error;
        }

        return NextResponse.json({ steps: data ?? [] });
    } catch (error: unknown) {
        return internalServerError("Error fetching simulation steps:", error);
    }
}

export async function POST(request: Request) {
    try {
        const { supabase, errorResponse } = await requireAdmin();
        if (errorResponse) {
            return errorResponse;
        }

        const body = (await request.json()) as {
            task_id?: unknown;
            step_order?: unknown;
        };
        const taskId = asNonEmptyString(body.task_id);
        const stepOrder = body.step_order === undefined
            ? 1
            : asOptionalNumber(body.step_order);

        if (!taskId) {
            return badRequest("task_id is required");
        }

        if (body.step_order !== undefined && stepOrder === undefined) {
            return badRequest("step_order must be a number");
        }

        const { data, error } = await supabase
            .from("simulation_steps")
            .insert({
                task_id: taskId,
                step_order: stepOrder,
            })
            .select("*")
            .single();

        if (error) {
            throw error;
        }

        revalidateQuestionsTag();

        return NextResponse.json({ step: data }, { status: 201 });
    } catch (error: unknown) {
        return internalServerError("Error creating simulation step:", error);
    }
}
