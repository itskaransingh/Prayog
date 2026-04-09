import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildRegistrationEvaluationMappings } from "../../lib/simulation/runtime-evaluation";
import type {
    SimulationFieldDefinition,
    SimulationFieldRecord,
} from "../../lib/simulation/answer-field-generator";

describe("runtime-evaluation", () => {
    it("keeps only approved itr registration fields in definition order", () => {
        const definitions: SimulationFieldDefinition[] = [
            {
                simulatorType: "itr_registration",
                fieldName: "pan",
                fieldLabel: "PAN",
                fieldGroup: "Registration",
                inputType: "text",
                sortOrder: 2,
                isActive: true,
                helpText: null,
            },
            {
                simulatorType: "itr_registration",
                fieldName: "firstName",
                fieldLabel: "First Name",
                fieldGroup: "Personal Details",
                inputType: "text",
                sortOrder: 1,
                isActive: true,
                helpText: null,
            },
        ];

        const fields: SimulationFieldRecord[] = [
            {
                id: "field-pan",
                field_name: "pan",
                field_label: "Permanent Account Number",
                expected_value: "ABCDE1234F",
            },
            {
                id: "field-extra",
                field_name: "unsupportedField",
                field_label: "Unsupported Field",
                expected_value: "should be ignored",
            },
            {
                id: "field-first-name",
                field_name: "firstName",
                field_label: null,
                expected_value: "Asha",
            },
        ];

        const result = buildRegistrationEvaluationMappings(
            "itr_registration",
            fields,
            definitions,
        );

        assert.deepEqual(result, [
            {
                fieldId: "field-first-name",
                fieldName: "personalDetails.firstName",
                fieldPath: "personalDetails.firstName",
                expectedValue: "Asha",
                label: "First Name",
                weight: 1,
            },
            {
                fieldId: "field-pan",
                fieldName: "pan",
                fieldPath: "pan",
                expectedValue: "ABCDE1234F",
                label: "Permanent Account Number",
                weight: 1,
            },
        ]);
    });

    it("falls back to approved ePAN definitions when no field rows exist yet", () => {
        const result = buildRegistrationEvaluationMappings(
            "epan_registration",
            [],
            null,
        );

        assert.equal(result[0]?.fieldPath, "fullName");
        assert.equal(result[0]?.label, "Full Name");
        assert.equal(result[0]?.expectedValue, "");
        assert.ok(
            result.some((mapping) => mapping.fieldPath === "aadhaarNumber"),
        );
    });
});
