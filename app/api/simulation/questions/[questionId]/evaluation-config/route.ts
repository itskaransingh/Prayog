import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
    isRegistrationSimulatorType,
    normalizeSimulationFieldDefinitions,
    resolveRegistrationFieldDefinitions,
    type RegistrationSimulatorType,
    type SimulatorType,
    type SimulationFieldDefinition,
    type SimulationFieldRecord,
} from "@/lib/simulation/answer-field-generator";
import {
    buildRegistrationEvaluationMappings,
    buildGstfEvaluationMappings,
    buildGstinEvaluationMappings,
    type SimulationEvaluationConfig,
} from "@/lib/simulation/runtime-evaluation";
import { GSTIN_SUBMODULE_ID } from "@/lib/simulation/gst/gstin-registration";

interface QuestionRecord {
    id: string;
    submodule_id: string;
    title?: string | null;
}

interface SubmoduleRecord {
    id: string;
    simulator_type: SimulatorType | null;
}

interface TaskRecord {
    id: string;
    show_expected_answers_in_evaluation: boolean | null;
}

async function loadRegistrationFieldDefinitions(
    supabase: Awaited<ReturnType<typeof createClient>>,
    simulatorType: RegistrationSimulatorType,
): Promise<SimulationFieldDefinition[]> {
    const { data, error } = await supabase
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

function buildEmptyConfig(
    simulatorType: RegistrationSimulatorType,
): SimulationEvaluationConfig {
    return {
        taskId: null,
        simulatorType,
        showExpectedAnswersInEvaluation: false,
        mappings: buildRegistrationEvaluationMappings(simulatorType, []),
        questionTitle: null,
    };
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ questionId: string }> },
) {
    try {
        const { questionId } = await params;
        const supabase = await createClient();

        const { data: question, error: questionError } = await supabase
            .from("questions")
            .select("id, submodule_id, title")
            .eq("id", questionId)
            .maybeSingle<QuestionRecord>();

        if (questionError) {
            throw questionError;
        }

        if (!question) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        const { data: submodule, error: submoduleError } = await supabase
            .from("submodules")
            .select("id, simulator_type")
            .eq("id", question.submodule_id)
            .maybeSingle<SubmoduleRecord>();

        if (submoduleError) {
            throw submoduleError;
        }

        if (!submodule) {
            return NextResponse.json(
                { error: "Question is not backed by a supported simulator" },
                { status: 400 },
            );
        }

        if (
            submodule.simulator_type !== "gstf-simulation" &&
            !isRegistrationSimulatorType(submodule.simulator_type)
        ) {
            return NextResponse.json(
                { error: "Question is not backed by a supported simulator" },
                { status: 400 },
            );
        }

        const simulatorType = submodule.simulator_type;
        const fieldDefinitions =
            simulatorType === "gstf-simulation"
                ? null
                : await loadRegistrationFieldDefinitions(
                      supabase,
                      simulatorType,
                  );

        const { data: task, error: taskError } = await supabase
            .from("simulation_tasks")
            .select("id, show_expected_answers_in_evaluation")
            .eq("question_id", questionId)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle<TaskRecord>();

        if (taskError) {
            throw taskError;
        }

        const isGstinSubmodule = submodule.id === GSTIN_SUBMODULE_ID;

        function buildGstfMappings(fieldRows: SimulationFieldRecord[]) {
            return isGstinSubmodule
                ? buildGstinEvaluationMappings(fieldRows)
                : buildGstfEvaluationMappings(fieldRows);
        }

        if (!task?.id) {
            if (simulatorType === "gstf-simulation") {
                return NextResponse.json({
                    taskId: null,
                    simulatorType,
                    showExpectedAnswersInEvaluation: false,
                    mappings: [],
                    questionTitle: question.title ?? null,
                    submoduleId: submodule.id,
                } satisfies SimulationEvaluationConfig);
            }

            return NextResponse.json({
                ...buildEmptyConfig(simulatorType),
                questionTitle: question.title ?? null,
                submoduleId: submodule.id,
            } satisfies SimulationEvaluationConfig);
        }

        const { data: steps, error: stepsError } = await supabase
            .from("simulation_steps")
            .select("id")
            .eq("task_id", task.id)
            .order("step_order", { ascending: true });

        if (stepsError) {
            throw stepsError;
        }

        const stepIds = (steps ?? []).map((step) => step.id);

        if (stepIds.length === 0) {
            return NextResponse.json({
                taskId: task.id,
                simulatorType,
                showExpectedAnswersInEvaluation:
                    task.show_expected_answers_in_evaluation ?? false,
                mappings:
                    simulatorType === "gstf-simulation"
                        ? buildGstfMappings([])
                        : buildRegistrationEvaluationMappings(
                              simulatorType,
                              [],
                              fieldDefinitions,
                          ),
                questionTitle: question.title ?? null,
                submoduleId: submodule.id,
            } satisfies SimulationEvaluationConfig);
        }

        const { data: fields, error: fieldsError } = await supabase
            .from("simulation_fields")
            .select("id, field_name, field_label, expected_value, order_index")
            .in("step_id", stepIds)
            .order("order_index", { ascending: true });

        if (fieldsError) {
            throw fieldsError;
        }

        return NextResponse.json({
            taskId: task.id,
            simulatorType,
            showExpectedAnswersInEvaluation:
                task.show_expected_answers_in_evaluation ?? false,
            mappings:
                simulatorType === "gstf-simulation"
                    ? buildGstfMappings(
                          (fields ?? []) as SimulationFieldRecord[],
                      )
                    : buildRegistrationEvaluationMappings(
                          simulatorType,
                          (fields ?? []) as SimulationFieldRecord[],
                          fieldDefinitions,
                      ),
            questionTitle: question.title ?? null,
            submoduleId: submodule.id,
        } satisfies SimulationEvaluationConfig);
    } catch (error) {
        console.error("Error fetching simulation evaluation config:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
