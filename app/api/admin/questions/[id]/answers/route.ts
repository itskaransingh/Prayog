import { NextResponse } from "next/server";

import {
    internalServerError,
    requireAdmin,
} from "@/app/api/admin/simulation-route-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    isRegistrationSimulatorType,
    normalizeSimulationFieldDefinitions,
    reverseParseFields,
    resolveRegistrationFieldDefinitions,
    type QuestionTableData,
    type SimulatorType,
    type SimulationFieldDefinition,
    type SimulationFieldRecord,
} from "@/lib/simulation/answer-field-generator";
import type { QuestionType } from "@/lib/questions/types";

interface QuestionRecord {
    id: string;
    submodule_id: string;
    table_data: QuestionTableData | null;
    type: QuestionType;
}

interface SubmoduleRecord {
    id: string;
    is_active: boolean;
    simulator_type: SimulatorType | null;
}

async function loadRegistrationFieldDefinitions(
    adminDb: ReturnType<typeof createAdminClient>,
    simulatorType: SimulatorType,
): Promise<SimulationFieldDefinition[] | null> {
    if (!isRegistrationSimulatorType(simulatorType)) {
        return null;
    }

    const { data, error } = await adminDb
        .from("simulation_field_definitions")
        .select(
            "id, simulator_type, field_name, field_label, field_group, input_type, sort_order, is_active, help_text",
        )
        .eq("simulator_type", simulatorType)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("field_name", { ascending: true });

    if (error) {
        throw error;
    }

    return resolveRegistrationFieldDefinitions(
        simulatorType,
        normalizeSimulationFieldDefinitions(data ?? []),
    );
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const { errorResponse } = await requireAdmin();
        if (errorResponse) {
            return errorResponse;
        }
        const adminDb = createAdminClient();

        const { data: question, error: questionError } = await adminDb
            .from("questions")
            .select("id, submodule_id, table_data, type")
            .eq("id", id)
            .maybeSingle<QuestionRecord>();

        if (questionError) {
            throw questionError;
        }

        if (!question) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        if (question.type !== null && question.type !== "question") {
            return NextResponse.json(
                { error: "Answers are only available for question tasks" },
                { status: 400 },
            );
        }

        const { data: submodule, error: submoduleError } = await adminDb
            .from("submodules")
            .select("id, is_active, simulator_type")
            .eq("id", question.submodule_id)
            .maybeSingle<SubmoduleRecord>();

        if (submoduleError) {
            throw submoduleError;
        }

        if (!submodule || !submodule.is_active) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        const simulatorType = submodule.simulator_type ?? "none";
        const registrationFieldDefinitions =
            await loadRegistrationFieldDefinitions(adminDb, simulatorType);

        const { data: task } = await adminDb
            .from("simulation_tasks")
            .select("id")
            .eq("question_id", id)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle<{ id: string }>();

        if (!task?.id) {
            return NextResponse.json({
                answers: null,
                fieldDefinitions: registrationFieldDefinitions,
                simulatorType,
            });
        }

        const { data: steps, error: stepsError } = await adminDb
            .from("simulation_steps")
            .select("id, step_order")
            .eq("task_id", task.id)
            .order("step_order", { ascending: true });

        if (stepsError) {
            throw stepsError;
        }

        const orderedSteps = steps ?? [];
        const stepIds = orderedSteps.map((step) => step.id);

        if (stepIds.length === 0) {
            return NextResponse.json({
                answers: null,
                fieldDefinitions: registrationFieldDefinitions,
                simulatorType,
            });
        }

        const { data: fields, error: fieldsError } = await adminDb
            .from("simulation_fields")
            .select("id, step_id, field_name, field_label, expected_value, options, order_index")
            .in("step_id", stepIds)
            .order("order_index", { ascending: true });

        if (fieldsError) {
            throw fieldsError;
        }

        const stepOrderMap = new Map(
            orderedSteps.map((step, index) => [step.id, index]),
        );
        const orderedFields = ((fields ?? []) as SimulationFieldRecord[]).sort(
            (left, right) => {
                const leftStepOrder = stepOrderMap.get(left.step_id ?? "") ?? Number.MAX_SAFE_INTEGER;
                const rightStepOrder =
                    stepOrderMap.get(right.step_id ?? "") ?? Number.MAX_SAFE_INTEGER;

                if (leftStepOrder !== rightStepOrder) {
                    return leftStepOrder - rightStepOrder;
                }

                return (left.order_index ?? Number.MAX_SAFE_INTEGER) -
                    (right.order_index ?? Number.MAX_SAFE_INTEGER);
            },
        );

        const answers = reverseParseFields(
            orderedFields,
            simulatorType,
            question.table_data,
            {
                registrationFieldDefinitions,
            },
        );

        return NextResponse.json({
            answers,
            fieldDefinitions: registrationFieldDefinitions,
            simulatorType,
        });
    } catch (error: unknown) {
        return internalServerError("Error fetching structured answers:", error);
    }
}
