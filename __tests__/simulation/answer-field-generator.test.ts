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
    type JournalEntryPayload,
    type LedgerPayload,
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
            field_type: "dropdown",
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

    it("generates and round-trips journal-entry payloads with multi-line transactions", () => {
        const payload: JournalEntryPayload = {
            type: "journal_entry",
            accountOptions: ["Cash", " Sales ", "Capital"],
            rows: [
                {
                    transactionDesc: "Started business with cash",
                    lines: [
                        { side: "debit", account: "Cash", amount: "50,000" },
                        { side: "credit", account: "Capital", amount: "50,000" },
                    ],
                },
                {
                    transactionDesc: "Professional fee with TDS",
                    lines: [
                        { side: "debit", account: "Bank", amount: "13,500" },
                        { side: "debit", account: "TDS Receivable", amount: "1,500" },
                        { side: "credit", account: "Professional Fees", amount: "15,000" },
                    ],
                },
                {
                    transactionDesc: "Ignored evidence row",
                    lines: [],
                },
            ],
        };

        const fields = generateFields("step-2", payload);

        assert.equal(fields.length, 8);
        assert.deepEqual(fields[0], {
            step_id: "step-2",
            field_name: "row1_description",
            field_type: "text",
            field_label: "Row 1 Description",
            expected_value: "Started business with cash",
            options: null,
            order_index: 1,
        });
        assert.deepEqual(fields[1], {
            step_id: "step-2",
            field_name: "row1_debit1_account",
            field_type: "dropdown",
            field_label: "Row 1 Debit 1 Account",
            expected_value: "Cash",
            options: ["Cash", "Sales", "Capital"],
            order_index: 2,
        });
        assert.equal(fields[2].expected_value, "50000");
        assert.equal(fields[7].field_name, "row2_credit1_amount");

        const roundTrip = reverseParseFields(
            asRecords(fields),
            "journal_entry",
            buildEvidenceTable(payload),
        );

        assert.deepEqual(roundTrip, {
            type: "journal_entry",
            accountOptions: ["Cash", "Sales", "Capital"],
            rows: [
                {
                    transactionDesc: "Started business with cash",
                    lines: [
                        { side: "debit", account: "Cash", amount: "50000" },
                        { side: "credit", account: "Capital", amount: "50000" },
                    ],
                },
                {
                    transactionDesc: "Professional fee with TDS",
                    lines: [
                        { side: "credit", account: "Professional Fees", amount: "15000" },
                        { side: "debit", account: "Bank", amount: "13500" },
                        { side: "debit", account: "TDS Receivable", amount: "1500" },
                    ],
                },
                {
                    transactionDesc: "Ignored evidence row",
                    lines: [],
                },
            ],
        });
    });

    it("generates and round-trips ledger payloads with transaction details", () => {
        const payload: LedgerPayload = {
            type: "ledger",
            accountOptions: ["Cash", "Bank", "Capital", "Sales"],
            rows: [
                {
                    transactionDesc: "Started business with cash",
                    debitRows: [{ account: "Cash", amount: "50,000" }],
                    creditRows: [{ account: "Capital", amount: "50,000" }],
                },
                {
                    transactionDesc: "Cash sales",
                    debitRows: [{ account: "Bank", amount: "12,000" }],
                    creditRows: [{ account: "Sales", amount: "12,000" }],
                },
            ],
            debitRows: [
                { account: "Cash", amount: "50,000" },
                { account: "Bank", amount: "12,000" },
            ],
            creditRows: [
                { account: "Capital", amount: "50,000" },
                { account: "Sales", amount: "12,000" },
            ],
        };

        const fields = generateFields("step-2b", payload);

        assert.equal(fields.length, 10);
        assert.deepEqual(fields[0], {
            step_id: "step-2b",
            field_name: "row1_description",
            field_type: "text",
            field_label: "Row 1 Description",
            expected_value: "Started business with cash",
            options: null,
            order_index: 1,
        });
        assert.equal(fields[1].field_name, "row1_debit1_account");
        assert.equal(fields[4].field_name, "row1_credit1_account");

        const roundTrip = reverseParseFields(
            asRecords(fields),
            "ledger",
            buildEvidenceTable(payload),
        );

        assert.deepEqual(roundTrip, {
            type: "ledger",
            accountOptions: ["Cash", "Bank", "Capital", "Sales"],
            rows: [
                {
                    transactionDesc: "Started business with cash",
                    debitRows: [{ account: "Cash", amount: "50000" }],
                    creditRows: [{ account: "Capital", amount: "50000" }],
                },
                {
                    transactionDesc: "Cash sales",
                    debitRows: [{ account: "Bank", amount: "12000" }],
                    creditRows: [{ account: "Sales", amount: "12000" }],
                },
            ],
            debitRows: [
                { account: "Cash", amount: "50000" },
                { account: "Bank", amount: "12000" },
            ],
            creditRows: [
                { account: "Capital", amount: "50000" },
                { account: "Sales", amount: "12000" },
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
            field_type: "select",
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
            field_type: "text",
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
            field_type: "text",
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

    it("restores transactionDesc from tableData for questions saved before description field was added", () => {
        // Old-style fields: only debit/credit, no description field
        const fields = [
            { field_name: "row1_debit_account", field_label: "Row 1 Debit Account", expected_value: "Cash", options: ["Cash", "Capital"], order_index: 1 },
            { field_name: "row1_debit_amount",  field_label: "Row 1 Debit Amount",  expected_value: "50000", options: null, order_index: 2 },
            { field_name: "row1_credit_account",field_label: "Row 1 Credit Account",expected_value: "Capital", options: ["Cash", "Capital"], order_index: 3 },
            { field_name: "row1_credit_amount", field_label: "Row 1 Credit Amount", expected_value: "50000", options: null, order_index: 4 },
        ];
        const tableData = { headers: ["#", "Transaction"], rows: [["1", "Started business with cash"]] };

        const result = reverseParseFields(fields as SimulationFieldRecord[], "journal_entry", tableData);
        assert.ok(result);
        assert.equal(result!.type, "journal_entry");
        const journalResult = result as JournalEntryPayload;
        assert.equal(journalResult.rows[0].transactionDesc, "Started business with cash");
        assert.equal(journalResult.rows[0].lines[0]?.account, "Cash");
        assert.equal(journalResult.rows[0].lines[1]?.account, "Capital");
    });

    it("parses legacy classification fields saved as field_N", () => {
        const fields: SimulationFieldRecord[] = [
            {
                id: "field-1",
                field_name: "field_1",
                field_label: "Sundry Creditors",
                expected_value: "Current Liability",
                options: ["Current Asset", "Current Liability"],
                order_index: 1,
            },
            {
                id: "field-2",
                field_name: "field_2",
                field_label: "Sundry Debtors",
                expected_value: "Current Asset",
                options: ["Current Asset", "Current Liability"],
                order_index: 2,
            },
        ];

        const result = reverseParseFields(fields, "classification", {
            headers: ["Sl. No.", "Account Name"],
            rows: [
                ["1", "Sundry Creditors"],
                ["2", "Sundry Debtors"],
            ],
        });

        assert.deepEqual(result, {
            type: "classification",
            options: ["Current Asset", "Current Liability"],
            rows: [
                { label: "Sundry Creditors", expected: "Current Liability" },
                { label: "Sundry Debtors", expected: "Current Asset" },
            ],
        });
    });

    it("parses legacy trial balance fields saved as rowN_account with debit/credit amounts", () => {
        const fields: SimulationFieldRecord[] = [
            {
                id: "field-1",
                field_name: "row1_account",
                field_label: "Account (Row 1)",
                expected_value: "Cash",
                options: ["Cash", "Capital"],
                order_index: 1,
            },
            {
                id: "field-2",
                field_name: "row1_debit_amount",
                field_label: "Debit Amount (Row 1)",
                expected_value: "12500",
                options: null,
                order_index: 2,
            },
            {
                id: "field-3",
                field_name: "row1_credit_amount",
                field_label: "Credit Amount (Row 1)",
                expected_value: "0",
                options: null,
                order_index: 3,
            },
            {
                id: "field-4",
                field_name: "row2_account",
                field_label: "Account (Row 2)",
                expected_value: "Capital",
                options: ["Cash", "Capital"],
                order_index: 4,
            },
            {
                id: "field-5",
                field_name: "row2_debit_amount",
                field_label: "Debit Amount (Row 2)",
                expected_value: "0",
                options: null,
                order_index: 5,
            },
            {
                id: "field-6",
                field_name: "row2_credit_amount",
                field_label: "Credit Amount (Row 2)",
                expected_value: "12500",
                options: null,
                order_index: 6,
            },
        ];

        const result = reverseParseFields(fields, "trial_balance");

        assert.deepEqual(result, {
            type: "trial_balance",
            accountOptions: ["Cash", "Capital"],
            rows: [
                { account: "Cash", side: "debit", amount: "12500" },
                { account: "Capital", side: "credit", amount: "12500" },
            ],
        });
    });

    it("parses legacy financial statement rows saved without section keys", () => {
        const fields: SimulationFieldRecord[] = [
            {
                id: "field-1",
                field_name: "row1_account",
                field_label: "Account (Row 1)",
                expected_value: "Sales",
                options: ["Sales", "Purchase", "Capital", "Building"],
                order_index: 1,
            },
            {
                id: "field-2",
                field_name: "row1_debit_amount",
                field_label: "Debit Amount (Row 1)",
                expected_value: "0",
                options: null,
                order_index: 2,
            },
            {
                id: "field-3",
                field_name: "row1_credit_amount",
                field_label: "Credit Amount (Row 1)",
                expected_value: "720000",
                options: null,
                order_index: 3,
            },
            {
                id: "field-4",
                field_name: "row2_account",
                field_label: "Account (Row 2)",
                expected_value: "Purchase",
                options: ["Sales", "Purchase", "Capital", "Building"],
                order_index: 4,
            },
            {
                id: "field-5",
                field_name: "row2_debit_amount",
                field_label: "Debit Amount (Row 2)",
                expected_value: "760450",
                options: null,
                order_index: 5,
            },
            {
                id: "field-6",
                field_name: "row2_credit_amount",
                field_label: "Credit Amount (Row 2)",
                expected_value: "0",
                options: null,
                order_index: 6,
            },
            {
                id: "field-7",
                field_name: "row3_account",
                field_label: "Account (Row 3)",
                expected_value: "Capital",
                options: ["Sales", "Purchase", "Capital", "Building"],
                order_index: 7,
            },
            {
                id: "field-8",
                field_name: "row3_debit_amount",
                field_label: "Debit Amount (Row 3)",
                expected_value: "0",
                options: null,
                order_index: 8,
            },
            {
                id: "field-9",
                field_name: "row3_credit_amount",
                field_label: "Credit Amount (Row 3)",
                expected_value: "200000",
                options: null,
                order_index: 9,
            },
            {
                id: "field-10",
                field_name: "row4_account",
                field_label: "Account (Row 4)",
                expected_value: "Building",
                options: ["Sales", "Purchase", "Capital", "Building"],
                order_index: 10,
            },
            {
                id: "field-11",
                field_name: "row4_debit_amount",
                field_label: "Debit Amount (Row 4)",
                expected_value: "27000",
                options: null,
                order_index: 11,
            },
            {
                id: "field-12",
                field_name: "row4_credit_amount",
                field_label: "Credit Amount (Row 4)",
                expected_value: "0",
                options: null,
                order_index: 12,
            },
        ];

        const result = reverseParseFields(fields, "financial_statement");

        assert.deepEqual(result, {
            type: "financial_statement",
            sections: [
                {
                    sectionKey: "pl_direct_expense",
                    options: ["Sales", "Purchase", "Capital", "Building"],
                    rows: [{ account: "Purchase", amount: "760450" }],
                },
                {
                    sectionKey: "pl_direct_income",
                    options: ["Sales", "Purchase", "Capital", "Building"],
                    rows: [{ account: "Sales", amount: "720000" }],
                },
                {
                    sectionKey: "bs_capital",
                    options: ["Sales", "Purchase", "Capital", "Building"],
                    rows: [{ account: "Capital", amount: "200000" }],
                },
                {
                    sectionKey: "bs_ppe",
                    options: ["Sales", "Purchase", "Capital", "Building"],
                    rows: [{ account: "Building", amount: "27000" }],
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
