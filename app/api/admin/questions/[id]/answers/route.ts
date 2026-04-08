import { NextResponse } from "next/server";

import {
    internalServerError,
    requireAdmin,
} from "@/app/api/admin/simulation-route-utils";
import {
    reverseParseFields,
    type QuestionTableData,
    type SimulatorType,
    type SimulationFieldRecord,
} from "@/lib/simulation/answer-field-generator";

interface QuestionRecord {
    id: string;
    submodule_id: string;
    table_data: QuestionTableData | null;
}

interface SubmoduleRecord {
    id: string;
    is_active: boolean;
    simulator_type: SimulatorType | null;
}

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const { supabase, errorResponse } = await requireAdmin();
        if (errorResponse) {
            return errorResponse;
        }

        const { data: question, error: questionError } = await supabase
            .from("questions")
            .select("id, submodule_id, table_data")
            .eq("id", id)
            .maybeSingle<QuestionRecord>();

        if (questionError) {
            throw questionError;
        }

        if (!question) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }

        const { data: submodule, error: submoduleError } = await supabase
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

        const { data: task } = await supabase
            .from("simulation_tasks")
            .select("id")
            .eq("question_id", id)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle<{ id: string }>();

        if (!task?.id) {
            return NextResponse.json({
                answers: null,
                simulatorType,
            });
        }

        const { data: step } = await supabase
            .from("simulation_steps")
            .select("id")
            .eq("task_id", task.id)
            .order("step_order", { ascending: true })
            .limit(1)
            .maybeSingle<{ id: string }>();

        if (!step?.id) {
            return NextResponse.json({
                answers: null,
                simulatorType,
            });
        }

        const { data: fields, error: fieldsError } = await supabase
            .from("simulation_fields")
            .select("id, step_id, field_name, field_label, expected_value, options, order_index")
            .eq("step_id", step.id)
            .order("order_index", { ascending: true });

        if (fieldsError) {
            throw fieldsError;
        }

        const answers = reverseParseFields(
            (fields ?? []) as SimulationFieldRecord[],
            simulatorType,
            question.table_data,
        );

        return NextResponse.json({
            answers,
            simulatorType,
        });
    } catch (error: unknown) {
        return internalServerError("Error fetching structured answers:", error);
    }
}
