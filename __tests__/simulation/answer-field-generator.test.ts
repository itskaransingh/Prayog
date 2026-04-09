import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
    buildEvidenceTable,
    generateFields,
    getFallbackRegistrationFieldDefinitions,
    normalizeSimulationFieldDefinitions,
    reverseParseFields,
    type ClassificationPayload,
    type FinancialStatementPayload,
    type GridPayload,
    type RegistrationPayload,
    type SimulationFieldRecord,
    type TrialBalancePayload,
} from "../../lib/simulation/answer-field-generator";

function asRecords(fields: ReturnType<typeof generateFields>): SimulationFieldRecord[] {
    return fields.map((field, index) => ({
        id: `field-${index + 1}`,
        ...field,
    }));
}

describe("answer-field-generator", () => {
    it("generates and round-trips classification payloads", () => {
        const payload: ClassificationPayload = {
            type: "classification",
            options: ["Revenue", " Capital ", "Expense"],
            rows: [
                { label: "Sale of goods", expected: "Revenue" },
                { label: "Rent paid", expected: "Expense" },
                { label: "", expected: "" },
            ],
        };

        const fields = generateFields("step-1", payload);

        assert.equal(fields.length, 2);
        assert.deepEqual(fields[0], {
            step_id: "step-1",
            field_name: "row1_classification",
            field_label: "Sale of goods",
            expected_value: "Revenue",
            options: ["Revenue", "Capital", "Expense"],
            order_index: 1,
        });

        const roundTrip = reverseParseFields(
            asRecords(fields),
            "classification",
            buildEvidenceTable(payload),
        );

        assert.deepEqual(roundTrip, {
            type: "classification",
            options: ["Revenue", "Capital", "Expense"],
            rows: [
                { label: "Sale of goods", expected: "Revenue" },
                { label: "Rent paid", expected: "Expense" },
            ],
        });
    });

    it("generates and round-trips grid payloads with transaction descriptions", () => {
        const payload: GridPayload = {
            type: "grid",
            accountOptions: ["Cash", " Sales ", "Capital"],
            rows: [
                {
                    transactionDesc: "Started business with cash",
                    drAccount: "Cash",
                    drAmount: "50,000",
                    crAccount: "Capital",
                    crAmount: "50,000",
                },
                {
                    transactionDesc: "Credit sale",
                    drAccount: "Debtors",
                    drAmount: "8,000",
                    crAccount: "Sales",
                    crAmount: "8,000",
                },
                {
                    transactionDesc: "Ignored evidence row",
                    drAccount: "",
                    drAmount: "",
                    crAccount: "",
                    crAmount: "",
                },
            ],
        };

        const fields = generateFields("step-2", payload);

        assert.equal(fields.length, 15);
        assert.deepEqual(fields[0], {
            step_id: "step-2",
            field_name: "row1_description",
            field_label: "Row 1 Description",
            expected_value: "Started business with cash",
            options: null,
            order_index: 1,
        });
        assert.deepEqual(fields[1], {
            step_id: "step-2",
            field_name: "row1_debit_account",
            field_label: "Row 1 Debit Account",
            expected_value: "Cash",
            options: ["Cash", "Sales", "Capital"],
            order_index: 2,
        });
        assert.equal(fields[2].expected_value, "50000");
        assert.equal(fields[14].order_index, 15);

        const roundTrip = reverseParseFields(
            asRecords(fields),
            "journal_entry",
            buildEvidenceTable(payload),
        );

        assert.deepEqual(roundTrip, {
            type: "grid",
            accountOptions: ["Cash", "Sales", "Capital"],
            rows: [
                {
                    transactionDesc: "Started business with cash",
                    drAccount: "Cash",
                    drAmount: "50000",
                    crAccount: "Capital",
                    crAmount: "50000",
                },
                {
                    transactionDesc: "Credit sale",
                    drAccount: "Debtors",
                    drAmount: "8000",
                    crAccount: "Sales",
                    crAmount: "8000",
                },
                {
                    transactionDesc: "Ignored evidence row",
                    drAccount: "",
                    drAmount: "",
                    crAccount: "",
                    crAmount: "",
                },
            ],
        });
    });

    it("generates and round-trips trial balance payloads", () => {
        const payload: TrialBalancePayload = {
            type: "trial_balance",
            accountOptions: ["Cash", "Capital"],
            rows: [
                { account: "Cash", side: "debit", amount: "12,500" },
                { account: "Capital", side: "credit", amount: "12,500" },
                { account: "", side: "debit", amount: "" },
            ],
        };

        const fields = generateFields("step-3", payload);

        assert.equal(fields.length, 4);
        assert.deepEqual(fields[2], {
            step_id: "step-3",
            field_name: "row2_credit_account",
            field_label: "Row 2 Credit Account",
            expected_value: "Capital",
            options: ["Cash", "Capital"],
            order_index: 3,
        });

        const roundTrip = reverseParseFields(asRecords(fields), "trial_balance");

        assert.deepEqual(roundTrip, {
            type: "trial_balance",
            accountOptions: ["Cash", "Capital"],
            rows: [
                { account: "Cash", side: "debit", amount: "12500" },
                { account: "Capital", side: "credit", amount: "12500" },
            ],
        });
    });

    it("generates and round-trips financial statement payloads", () => {
        const payload: FinancialStatementPayload = {
            type: "financial_statement",
            sections: [
                {
                    sectionKey: "pl_direct_expense",
                    options: ["Opening Stock", "Purchases"],
                    rows: [
                        { account: "Opening Stock", amount: "9,000" },
                        { account: "", amount: "" },
                    ],
                },
                {
                    sectionKey: "bs_ca",
                    options: ["Cash", "Bank"],
                    rows: [{ account: "Cash", amount: "18,500" }],
                },
            ],
        };

        const fields = generateFields("step-4", payload);

        assert.equal(fields.length, 4);
        assert.equal(fields[0].field_name, "pl_direct_expense_row1_account");
        assert.equal(fields[1].expected_value, "9000");
        assert.equal(fields[2].field_name, "bs_ca_row1_account");
        assert.equal(fields[3].order_index, 4);

        const roundTrip = reverseParseFields(asRecords(fields), "financial_statement");

        assert.deepEqual(roundTrip, {
            type: "financial_statement",
            sections: [
                {
                    sectionKey: "pl_direct_expense",
                    options: ["Opening Stock", "Purchases"],
                    rows: [{ account: "Opening Stock", amount: "9000" }],
                },
                {
                    sectionKey: "bs_ca",
                    options: ["Cash", "Bank"],
                    rows: [{ account: "Cash", amount: "18500" }],
                },
            ],
        });
    });

    it("generates and round-trips registration payloads", () => {
        const payload: RegistrationPayload = {
            type: "registration",
            fields: [
                {
                    fieldPath: "personalDetails.firstName",
                    expectedValue: "Aarav",
                },
                {
                    fieldPath: "personalDetails.dob",
                    expectedValue: "2000-01-01",
                },
                {
                    fieldPath: "personalDetails.lastName",
                    expectedValue: "",
                },
            ],
        };

        const fields = generateFields("step-5", payload);

        assert.equal(fields.length, 2);
        assert.deepEqual(fields[0], {
            step_id: "step-5",
            field_name: "personalDetails.firstName",
            field_label: "First Name",
            expected_value: "Aarav",
            options: null,
            order_index: 1,
        });

        const roundTrip = reverseParseFields(asRecords(fields), "itr_registration");

        assert.deepEqual(roundTrip, {
            type: "registration",
            fields: [
                {
                    fieldPath: "personalDetails.firstName",
                    expectedValue: "Aarav",
                },
                {
                    fieldPath: "personalDetails.dob",
                    expectedValue: "2000-01-01",
                },
            ],
        });
    });

    it("uses approved registration metadata for labels and filters stale saved fields", () => {
        const definitions = getFallbackRegistrationFieldDefinitions("epan_registration");
        const payload: RegistrationPayload = {
            type: "registration",
            fields: [
                {
                    fieldPath: "aadhaarNumber",
                    expectedValue: "123412341234",
                },
            ],
        };

        const fields = generateFields("step-6", payload, {
            registrationFieldDefinitions: definitions,
        });

        assert.deepEqual(fields[0], {
            step_id: "step-6",
            field_name: "aadhaarNumber",
            field_label: "Aadhaar Number",
            expected_value: "123412341234",
            options: null,
            order_index: 1,
        });

        const roundTrip = reverseParseFields(
            [
                ...asRecords(fields),
                {
                    id: "field-stale",
                    step_id: "step-6",
                    field_name: "pan",
                    field_label: "PAN",
                    expected_value: "ABCDE1234F",
                    options: null,
                    order_index: 99,
                },
            ],
            "epan_registration",
            null,
            {
                registrationFieldDefinitions: definitions,
            },
        );

        assert.deepEqual(roundTrip, {
            type: "registration",
            fields: [
                {
                    fieldPath: "aadhaarNumber",
                    expectedValue: "123412341234",
                },
            ],
        });
    });

    it("normalizes legacy flat itr field names to canonical dotted paths", () => {
        const normalized = normalizeSimulationFieldDefinitions([
            {
                id: "def-first-name",
                simulator_type: "itr_registration",
                field_name: "firstName",
                field_label: "First Name",
                field_group: "Personal Details",
                input_type: "text",
                sort_order: 1,
                is_active: true,
                help_text: null,
            },
            {
                id: "def-pan",
                simulator_type: "itr_registration",
                field_name: "pan",
                field_label: "PAN",
                field_group: "Registration",
                input_type: "text",
                sort_order: 2,
                is_active: true,
                help_text: null,
            },
        ]);

        assert.deepEqual(normalized.map((definition) => definition.fieldName), [
            "personalDetails.firstName",
            "pan",
        ]);
    });
});
