import { NextResponse } from "next/server";

import type { EvaluationResult, FieldResult } from "@/lib/evaluation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface TaskAnswerPayload {
    field_id?: string;
    field_name?: string;
    entered_value: string;
}

interface SimulationFieldRecord {
    id: string;
    field_name: string | null;
    field_label: string | null;
    expected_value: string | null;
}

function normalizeValue(value: string | null | undefined): string {
    return (value ?? "").trim();
}

function getErrorMessage(error: unknown): string {
    if (error && typeof error === "object" && "message" in error) {
        return String(error.message);
    }

    return "Internal Server Error";
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            question_id,
            task_id,
            start_time,
            end_time,
            task_answers,
        } = body as {
            question_id?: string;
            task_id?: string;
            start_time?: number;
            end_time?: number;
            task_answers?: TaskAnswerPayload[];
        };

        if (!question_id) {
            return NextResponse.json({ error: "Missing question_id." }, { status: 400 });
        }

        if (!Array.isArray(task_answers) || task_answers.length === 0) {
            return NextResponse.json({ error: "No answers submitted." }, { status: 400 });
        }

        const supabase = await createClient();
        const supabaseAdmin = createAdminClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "You must be logged in to save attempts." }, { status: 401 });
        }

        const resolvedTaskId = task_id
            ? task_id
            : (
                await supabaseAdmin
                    .from("simulation_tasks")
                    .select("id")
                    .eq("question_id", question_id)
                    .limit(1)
                    .maybeSingle()
            ).data?.id ?? null;

        if (!resolvedTaskId) {
            return NextResponse.json({ error: "Simulation task not found." }, { status: 404 });
        }

        const { data: steps, error: stepsError } = await supabaseAdmin
            .from("simulation_steps")
            .select("id")
            .eq("task_id", resolvedTaskId);

        if (stepsError) {
            throw stepsError;
        }

        const stepIds = (steps ?? []).map((step) => step.id);
        if (stepIds.length === 0) {
            return NextResponse.json({ error: "Simulation steps not found." }, { status: 404 });
        }

        const { data: fields, error: fieldsError } = await supabaseAdmin
            .from("simulation_fields")
            .select("id, field_name, field_label, expected_value")
            .in("step_id", stepIds);

        if (fieldsError) {
            throw fieldsError;
        }

        const fieldRecords = (fields as SimulationFieldRecord[] | null) ?? [];
        const fieldMapById = new Map<string, SimulationFieldRecord>(
            fieldRecords.map((field) => [field.id, field]),
        );
        const fieldMapByName = new Map<string, SimulationFieldRecord>(
            fieldRecords
                .filter((field): field is SimulationFieldRecord & { field_name: string } => Boolean(field.field_name))
                .map((field) => [field.field_name, field]),
        );

        const resolvedAnswers = task_answers.map((answer) => {
            const field = answer.field_id
                ? fieldMapById.get(answer.field_id)
                : answer.field_name
                ? fieldMapByName.get(answer.field_name)
                : undefined;

            if (!field) {
                throw new Error(
                    `Unable to match submitted answer to a simulation field (${answer.field_name || answer.field_id || "unknown"}).`,
                );
            }

            const entered = normalizeValue(answer.entered_value);
            const expected = normalizeValue(field.expected_value);
            const isCorrect = entered === expected;

            return {
                field,
                entered,
                expected,
                isCorrect,
            };
        });

        const fieldBreakdown: FieldResult[] = resolvedAnswers.map(({ field, entered, expected, isCorrect }) => ({
            field: field.field_label || field.field_name || "Unnamed field",
            entered: entered || "(empty)",
            expected,
            score: isCorrect ? 1 : 0,
            status: isCorrect ? "correct" : "incorrect",
        }));

        const totalScore = fieldBreakdown.reduce((sum, item) => sum + item.score, 0);
        const maxPossibleScore = fieldBreakdown.length;
        const accuracy = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
        const safeStartTime = typeof start_time === "number" ? start_time : Date.now();
        const safeEndTime = typeof end_time === "number" ? end_time : Date.now();
        const timeTakenSeconds = Math.max(0, Math.round((safeEndTime - safeStartTime) / 1000));

        const results: EvaluationResult = {
            accuracy,
            totalScore,
            maxPossibleScore,
            fieldBreakdown,
            timeTakenSeconds,
        };

        const { data: attemptData, error: attemptError } = await supabaseAdmin
            .from("user_simulation_attempts")
            .insert({
                user_id: user.id,
                task_id: resolvedTaskId,
                start_time: new Date(safeStartTime).toISOString(),
                end_time: new Date(safeEndTime).toISOString(),
                total_score: totalScore,
                max_possible_score: maxPossibleScore,
                accuracy,
                time_taken_seconds: timeTakenSeconds,
            })
            .select("id")
            .single();

        if (attemptError) {
            throw new Error(`Failed to create simulation attempt: ${attemptError.message}`);
        }

        const { data: questionAttemptData, error: questionAttemptError } = await supabaseAdmin
            .from("user_question_attempts")
            .insert({
                attempt_id: attemptData.id,
                question_id,
                is_correct: resolvedAnswers.every((answer) => answer.isCorrect),
            })
            .select("id")
            .single();

        if (questionAttemptError) {
            throw new Error(`Failed to create question attempt: ${questionAttemptError.message}`);
        }

        const { error: answersError } = await supabaseAdmin
            .from("user_simulation_answers")
            .insert(
                resolvedAnswers.map(({ field, entered, isCorrect }) => ({
                    attempt_id: attemptData.id,
                    question_attempt_id: questionAttemptData.id,
                    field_id: field.id,
                    entered_value: entered,
                    is_correct: isCorrect,
                })),
            );

        if (answersError) {
            throw new Error(`Failed to save simulation answers: ${answersError.message}`);
        }

        return NextResponse.json({
            success: true,
            attemptId: attemptData.id,
            questionAttemptId: questionAttemptData.id,
            results,
        });
    } catch (error) {
        console.error("Failed to save simulation attempt", error);
        return NextResponse.json(
            { error: getErrorMessage(error) },
            { status: 500 },
        );
    }
}
