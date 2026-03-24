import { RegistrationData } from "./simulation/registration-context";
import type { EvaluationMapping } from "./supabase/questions";

export interface FieldResult {
    field: string;
    entered: string;
    expected: string;
    score: number; // 0, 0.5, or 1
    status: "correct" | "partial" | "incorrect";
}

export interface EvaluationResult {
    accuracy: number;
    totalScore: number;
    maxPossibleScore: number;
    fieldBreakdown: FieldResult[];
    timeTakenSeconds: number;
}

/**
 * Normalizes strings for comparison (lowercase, trimmed)
 */
function normalize(str: string): string {
    return (str || "").trim().toLowerCase();
}

/**
 * Scores a single field comparison
 */
function scoreField(entered: string, expected: string): { score: number; status: FieldResult["status"] } {
    const e = normalize(entered);
    const x = normalize(expected);

    if (e === x) {
        return { score: 1, status: "correct" };
    }

    if (x.includes(e) && e.length > 0 && e.length >= x.length / 2) {
        return { score: 0.5, status: "partial" };
    }

    return { score: 0, status: "incorrect" };
}

function getValueAtPath(
    source: RegistrationData,
    fieldPath: string
): string {
    const value = fieldPath.split(".").reduce<unknown>((current, segment) => {
        if (current && typeof current === "object" && segment in current) {
            return (current as Record<string, unknown>)[segment];
        }

        return "";
    }, source);

    return typeof value === "string" ? value : "";
}

/**
 * Evaluates the complete registration data against DB-backed field mappings
 */
export function evaluateRegistration(
    data: RegistrationData,
    startTime: number,
    endTime: number,
    mappings: EvaluationMapping[]
): EvaluationResult {
    const breakdown: FieldResult[] = [];

    let totalScore = 0;
    const maxPossibleScore = mappings.reduce(
        (sum, mapping) => sum + (mapping.weight ?? 1),
        0
    );

    for (const mapping of mappings) {
        const entered = getValueAtPath(data, mapping.fieldPath);
        const expected = mapping.expectedValue;
        const weight = mapping.weight ?? 1;
        const { score, status } = scoreField(entered, expected);
        const weightedScore = score * weight;

        totalScore += weightedScore;
        breakdown.push({
            field: mapping.label,
            entered: entered || "(empty)",
            expected,
            score: weightedScore,
            status,
        });
    }

    const accuracy = maxPossibleScore > 0
        ? Math.round((totalScore / maxPossibleScore) * 100)
        : 0;
    const timeTakenSeconds = Math.round((endTime - startTime) / 1000);

    return {
        accuracy,
        totalScore,
        maxPossibleScore,
        fieldBreakdown: breakdown,
        timeTakenSeconds,
    };
}
