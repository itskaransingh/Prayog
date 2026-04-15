import {
    resolveRegistrationFieldDefinitions,
    normalizeRegistrationFieldPath,
    type RegistrationSimulatorType,
    type SimulationFieldDefinition,
    type SimulationFieldRecord,
} from "@/lib/simulation/answer-field-generator";
import { getTrnFieldPathFromLabel } from "@/lib/simulation/gst/trn-registration";
import type { PersistableEvaluationMapping } from "@/lib/simulation/attempts";

export interface SimulationEvaluationConfig {
    taskId: string | null;
    simulatorType: RegistrationSimulatorType | "gstf-simulation";
    showExpectedAnswersInEvaluation: boolean;
    mappings: PersistableEvaluationMapping[];
    questionTitle?: string | null;
}

function trimValue(value: string | null | undefined): string {
    return (value ?? "").trim();
}

export function buildRegistrationEvaluationMappings(
    simulatorType: RegistrationSimulatorType,
    fields: SimulationFieldRecord[],
    definitions?: SimulationFieldDefinition[] | null,
): PersistableEvaluationMapping[] {
    const resolvedDefinitions = resolveRegistrationFieldDefinitions(
        simulatorType,
        definitions,
    );

    const fieldsByName = new Map<string, SimulationFieldRecord>();

    for (const field of fields) {
        const fieldName = normalizeRegistrationFieldPath(
            simulatorType,
            trimValue(field.field_name),
        );
        if (!fieldName || fieldsByName.has(fieldName)) {
            continue;
        }

        fieldsByName.set(fieldName, field);
    }

    return resolvedDefinitions.map((definition) => {
        const matchedField = fieldsByName.get(definition.fieldName);

        return {
            fieldId: trimValue(matchedField?.id) || undefined,
            fieldName: definition.fieldName,
            fieldPath: definition.fieldName,
            expectedValue: trimValue(matchedField?.expected_value),
            label:
                trimValue(matchedField?.field_label) || definition.fieldLabel,
            weight: 1,
        };
    });
}

export function buildGstfEvaluationMappings(
    fields: SimulationFieldRecord[],
): PersistableEvaluationMapping[] {
    return [...fields]
        .sort(
            (left, right) =>
                (left.order_index ?? Number.MAX_SAFE_INTEGER) -
                (right.order_index ?? Number.MAX_SAFE_INTEGER),
        )
        .map((field, index) => {
            const label = trimValue(field.field_label) || `Field ${index + 1}`;

            return {
                fieldId: trimValue(field.id) || undefined,
                fieldName: trimValue(field.field_name) || undefined,
                fieldPath: getTrnFieldPathFromLabel(label, index),
                expectedValue: trimValue(field.expected_value),
                label,
                weight: 1,
            };
        });
}
