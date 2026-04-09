import {
    resolveRegistrationFieldDefinitions,
    type RegistrationSimulatorType,
    type SimulationFieldDefinition,
    type SimulationFieldRecord,
} from "@/lib/simulation/answer-field-generator";
import type { PersistableEvaluationMapping } from "@/lib/simulation/attempts";

export interface SimulationEvaluationConfig {
    taskId: string | null;
    simulatorType: RegistrationSimulatorType;
    showExpectedAnswersInEvaluation: boolean;
    mappings: PersistableEvaluationMapping[];
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
        const fieldName = trimValue(field.field_name);
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
