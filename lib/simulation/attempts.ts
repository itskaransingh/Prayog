import { getValueAtPath, type EvaluationMapping } from "@/lib/evaluation";

export interface PersistableEvaluationMapping extends EvaluationMapping {
    fieldId?: string;
    fieldName?: string;
}

export interface SimulationAttemptAnswerInput {
    field_id?: string;
    field_name?: string;
    entered_value: string;
}

export interface SaveSimulationAttemptInput {
    questionId: string;
    taskId?: string | null;
    startTime: number;
    endTime: number;
    answers: SimulationAttemptAnswerInput[];
}

export function buildAttemptAnswers<T>(
    data: T,
    mappings: PersistableEvaluationMapping[],
): SimulationAttemptAnswerInput[] {
    return mappings.map((mapping) => ({
        field_id: mapping.fieldId,
        field_name: mapping.fieldName || mapping.fieldPath,
        entered_value: getValueAtPath(data, mapping.fieldPath),
    }));
}

export async function saveSimulationAttempt({
    questionId,
    taskId,
    startTime,
    endTime,
    answers,
}: SaveSimulationAttemptInput) {
    const response = await fetch("/api/simulation/attempts", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            question_id: questionId,
            task_id: taskId,
            start_time: startTime,
            end_time: endTime,
            task_answers: answers,
        }),
    });

    const payload = await response.json();

    if (!response.ok) {
        throw new Error(payload?.error || "Failed to save simulation attempt.");
    }

    return payload;
}
