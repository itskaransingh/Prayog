"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Plus, Save, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export type SimulatorType =
    | "none"
    | "classification"
    | "itr_registration"
    | "epan_registration"
    | "journal_entry"
    | "ledger"
    | "trial_balance"
    | "financial_statement";

export interface SimulationFieldRecord {
    id: string;
    step_id: string;
    field_name: string;
    field_label: string | null;
    expected_value: string | null;
    options: string[] | null;
    order_index: number | null;
}

export interface SimulationFieldDraft {
    field_name: string;
    field_label: string | null;
    expected_value: string | null;
    options?: string[];
    order_index?: number;
}

interface QuestionTableData {
    headers?: string[];
    rows?: string[][];
}

interface SimulationAnswersSectionProps {
    simulatorType: SimulatorType | null;
    questionId: string | null;
    questionHasTable: boolean;
    questionTableData: QuestionTableData | null;
    fields: SimulationFieldRecord[];
    taskId: string | null;
    stepId: string | null;
    isLoading: boolean;
    isSaving: boolean;
    onSave: (fields: SimulationFieldDraft[]) => Promise<void>;
    onDeleteField: (fieldId: string) => Promise<void>;
}

interface RegistrationRow {
    fieldPath: string;
    expectedValue: string;
}

interface ClassificationRow {
    fieldLabel: string;
    expectedValue: string;
}

interface GridRow {
    debitAccount: string;
    debitAmount: string;
    creditAccount: string;
    creditAmount: string;
}

interface TrialBalanceRow {
    account: string;
    side: "debit" | "credit";
    amount: string;
}

interface FinancialStatementRow {
    account: string;
    amount: string;
}

interface GenericFieldRow {
    id?: string;
    field_name: string;
    field_label: string;
    expected_value: string;
    optionsText: string;
    order_index: string;
}

interface FinancialStatementSection {
    key: string;
    label: string;
}

const ITR_FIELD_PATHS = [
    "registerAs",
    "pan",
    "personalDetails.firstName",
    "personalDetails.middleName",
    "personalDetails.lastName",
    "personalDetails.dob",
    "personalDetails.gender",
    "personalDetails.residentialStatus",
    "addressDetails.flatDoorNo",
    "addressDetails.road",
    "addressDetails.area",
    "addressDetails.postOffice",
    "addressDetails.city",
    "addressDetails.state",
    "addressDetails.pincode",
    "contactDetails.mobile",
    "contactDetails.email",
    "contactDetails.alternateContact",
    "contactDetails.mobileBelongsTo",
    "contactDetails.emailBelongsTo",
] as const;

const EPAN_FIELD_PATHS = [
    "fullName",
    "dob",
    "gender",
    "mobile",
    "email",
    "address",
    "aadhaarNumber",
] as const;

const FINANCIAL_STATEMENT_SECTIONS: FinancialStatementSection[] = [
    { key: "pl_direct_expense", label: "P&L Direct Expense" },
    { key: "pl_direct_income", label: "P&L Direct Income" },
    { key: "pl_indirect_expense", label: "P&L Indirect Expense" },
    { key: "pl_indirect_income", label: "P&L Indirect Income" },
    { key: "bs_capital", label: "Balance Sheet Capital" },
    { key: "bs_ncl", label: "Balance Sheet Non-Current Liabilities" },
    { key: "bs_cl", label: "Balance Sheet Current Liabilities" },
    { key: "bs_ppe", label: "Balance Sheet Property, Plant & Equipment" },
    { key: "bs_onca", label: "Balance Sheet Other Non-Current Assets" },
    { key: "bs_ca", label: "Balance Sheet Current Assets" },
];

const EMPTY_GRID_ROW: GridRow = {
    debitAccount: "",
    debitAmount: "",
    creditAccount: "",
    creditAmount: "",
};

const EMPTY_TRIAL_BALANCE_ROW: TrialBalanceRow = {
    account: "",
    side: "debit",
    amount: "",
};

function splitOptions(value: string) {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function fieldPathToLabel(fieldPath: string) {
    return fieldPath
        .split(".")
        .at(-1)
        ?.replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, (char) => char.toUpperCase()) ?? fieldPath;
}

function parsePositiveInt(value: string) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function isRowBlank(values: string[]) {
    return values.every((value) => value.trim().length === 0);
}

function defaultFieldLabelFromTableRow(row: string[], index: number) {
    const firstNonEmptyCell = row.find((cell) => cell.trim().length > 0);
    return firstNonEmptyCell?.trim() || `Row ${index + 1}`;
}

function deriveClassificationState(
    rows: string[][],
    fields: SimulationFieldRecord[]
) {
    const sharedOptions = fields[0]?.options?.join(", ") ?? "";
    const nextRows = rows.map((tableRow, index) => {
        const field = fields.find((item) => item.order_index === index + 1);
        return {
            fieldLabel:
                field?.field_label?.trim() || defaultFieldLabelFromTableRow(tableRow, index),
            expectedValue: field?.expected_value ?? "",
        };
    });

    return {
        classificationOptionsText: sharedOptions,
        classificationRows: nextRows,
    };
}

function deriveRegistrationRows(fields: SimulationFieldRecord[]) {
    return fields.length > 0
        ? fields.map((field) => ({
              fieldPath: field.field_name,
              expectedValue: field.expected_value ?? "",
          }))
        : [{ fieldPath: "", expectedValue: "" }];
}

function deriveGridRows(
    rowCount: number,
    fields: SimulationFieldRecord[]
) {
    const grouped = new Map<number, GridRow>();

    for (const field of fields) {
        const match = field.field_name.match(/^row(\d+)_(debit|credit)_(account|amount)$/);
        if (!match) {
            continue;
        }

        const rowNumber = Number.parseInt(match[1], 10);
        const side = match[2];
        const kind = match[3];
        const existing = grouped.get(rowNumber) ?? { ...EMPTY_GRID_ROW };
        const key = `${side}${kind === "account" ? "Account" : "Amount"}` as keyof GridRow;
        existing[key] = field.expected_value ?? "";
        grouped.set(rowNumber, existing);
    }

    const targetLength = Math.max(rowCount, grouped.size, 1);
    return Array.from({ length: targetLength }, (_, index) => grouped.get(index + 1) ?? { ...EMPTY_GRID_ROW });
}

function deriveTrialBalanceRows(
    rowCount: number,
    fields: SimulationFieldRecord[]
) {
    const grouped = new Map<number, TrialBalanceRow>();

    for (const field of fields) {
        const match = field.field_name.match(/^row(\d+)_(debit|credit)_(account|amount)$/);
        if (!match) {
            continue;
        }

        const rowNumber = Number.parseInt(match[1], 10);
        const side = match[2] as "debit" | "credit";
        const kind = match[3];
        const existing = grouped.get(rowNumber) ?? { ...EMPTY_TRIAL_BALANCE_ROW };

        if (kind === "account") {
            existing.account = field.expected_value ?? "";
            existing.side = side;
        } else {
            existing.amount = field.expected_value ?? "";
            existing.side = side;
        }

        grouped.set(rowNumber, existing);
    }

    const targetLength = Math.max(rowCount, grouped.size, 1);
    return Array.from({ length: targetLength }, (_, index) => grouped.get(index + 1) ?? { ...EMPTY_TRIAL_BALANCE_ROW });
}

function deriveFinancialStatementRows(fields: SimulationFieldRecord[]) {
    const rowsBySection = Object.fromEntries(
        FINANCIAL_STATEMENT_SECTIONS.map((section) => [section.key, [] as FinancialStatementRow[]])
    ) as Record<string, FinancialStatementRow[]>;
    const optionsBySection: Record<string, string> = {};

    for (const section of FINANCIAL_STATEMENT_SECTIONS) {
        const accountFields = fields
            .filter((field) =>
                field.field_name.startsWith(`${section.key}_row`) &&
                field.field_name.endsWith("_account")
            )
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

        const amountFields = fields
            .filter((field) =>
                field.field_name.startsWith(`${section.key}_row`) &&
                field.field_name.endsWith("_amount")
            )
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

        const rowCount = Math.max(accountFields.length, amountFields.length);
        rowsBySection[section.key] =
            rowCount > 0
                ? Array.from({ length: rowCount }, (_, index) => ({
                      account: accountFields[index]?.expected_value ?? "",
                      amount: amountFields[index]?.expected_value ?? "",
                  }))
                : [{ account: "", amount: "" }];
        optionsBySection[section.key] = accountFields[0]?.options?.join(", ") ?? "";
    }

    return { financialStatementRows: rowsBySection, financialStatementOptions: optionsBySection };
}

function deriveGenericFields(fields: SimulationFieldRecord[]) {
    return fields.length > 0
        ? fields.map((field) => ({
              id: field.id,
              field_name: field.field_name,
              field_label: field.field_label ?? "",
              expected_value: field.expected_value ?? "",
              optionsText: field.options?.join(", ") ?? "",
              order_index: field.order_index?.toString() ?? "",
          }))
        : [
              {
                  field_name: "",
                  field_label: "",
                  expected_value: "",
                  optionsText: "",
                  order_index: "1",
              },
          ];
}

export function SimulationAnswersSection({
    simulatorType,
    questionId,
    questionHasTable,
    questionTableData,
    fields,
    taskId,
    stepId,
    isLoading,
    isSaving,
    onSave,
    onDeleteField,
}: SimulationAnswersSectionProps) {
    const [registrationRows, setRegistrationRows] = useState<RegistrationRow[]>([
        { fieldPath: "", expectedValue: "" },
    ]);
    const [classificationOptionsText, setClassificationOptionsText] = useState("");
    const [classificationRows, setClassificationRows] = useState<ClassificationRow[]>([]);
    const [gridOptionsText, setGridOptionsText] = useState("");
    const [gridRows, setGridRows] = useState<GridRow[]>([{ ...EMPTY_GRID_ROW }]);
    const [trialBalanceOptionsText, setTrialBalanceOptionsText] = useState("");
    const [trialBalanceRows, setTrialBalanceRows] = useState<TrialBalanceRow[]>([
        { ...EMPTY_TRIAL_BALANCE_ROW },
    ]);
    const [financialStatementRows, setFinancialStatementRows] = useState<
        Record<string, FinancialStatementRow[]>
    >(
        Object.fromEntries(
            FINANCIAL_STATEMENT_SECTIONS.map((section) => [
                section.key,
                [{ account: "", amount: "" }],
            ])
        ) as Record<string, FinancialStatementRow[]>
    );
    const [financialStatementOptions, setFinancialStatementOptions] = useState<Record<string, string>>(
        Object.fromEntries(
            FINANCIAL_STATEMENT_SECTIONS.map((section) => [section.key, ""])
        ) as Record<string, string>
    );
    const [genericFields, setGenericFields] = useState<GenericFieldRow[]>([]);

    useEffect(() => {
        const tableRows = questionTableData?.rows ?? [];

        if (simulatorType === "classification") {
            const next = deriveClassificationState(tableRows, fields);
            setClassificationOptionsText(next.classificationOptionsText);
            setClassificationRows(next.classificationRows);
            return;
        }

        if (
            simulatorType === "itr_registration" ||
            simulatorType === "epan_registration"
        ) {
            setRegistrationRows(deriveRegistrationRows(fields));
            return;
        }

        if (simulatorType === "journal_entry" || simulatorType === "ledger") {
            setGridOptionsText(fields.find((field) => field.field_name.endsWith("_account"))?.options?.join(", ") ?? "");
            setGridRows(deriveGridRows(tableRows.length, fields));
            return;
        }

        if (simulatorType === "trial_balance") {
            setTrialBalanceOptionsText(
                fields.find((field) => field.field_name.endsWith("_account"))?.options?.join(", ") ?? ""
            );
            setTrialBalanceRows(deriveTrialBalanceRows(tableRows.length, fields));
            return;
        }

        if (simulatorType === "financial_statement") {
            const next = deriveFinancialStatementRows(fields);
            setFinancialStatementRows(next.financialStatementRows);
            setFinancialStatementOptions(next.financialStatementOptions);
            return;
        }

        setGenericFields(deriveGenericFields(fields));
    }, [fields, questionTableData, simulatorType]);

    if (!questionId) {
        return (
            <div className="space-y-3">
                <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        Configure ground-truth answers for each evaluated field.
                    </h3>
                    <p className="text-sm text-slate-500">
                        Select a question to configure its answers.
                    </p>
                </div>
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    Select a question to configure its answers.
                </div>
            </div>
        );
    }

    const saveRegistration = async () => {
        const normalizedPaths = registrationRows
            .map((row) => row.fieldPath.trim())
            .filter(Boolean);
        const uniquePaths = new Set(normalizedPaths);

        if (uniquePaths.size !== normalizedPaths.length) {
            return;
        }

        const drafts = registrationRows
            .filter((row) => row.fieldPath.trim())
            .map((row, index) => ({
                field_name: row.fieldPath.trim(),
                field_label: fieldPathToLabel(row.fieldPath.trim()),
                expected_value: row.expectedValue.trim(),
                order_index: index + 1,
            }));

        await onSave(drafts);
    };

    const saveClassification = async () => {
        if (!questionHasTable) {
            return;
        }

        const options = splitOptions(classificationOptionsText);
        const drafts = classificationRows
            .filter((row) => !isRowBlank([row.fieldLabel, row.expectedValue]))
            .map((row, index) => ({
                field_name: `row${index + 1}_classification`,
                field_label: row.fieldLabel.trim(),
                expected_value: row.expectedValue.trim(),
                options,
                order_index: index + 1,
            }));

        await onSave(drafts);
    };

    const saveGrid = async () => {
        const options = splitOptions(gridOptionsText);
        const drafts: SimulationFieldDraft[] = [];

        gridRows.forEach((row, index) => {
            if (
                isRowBlank([
                    row.debitAccount,
                    row.debitAmount,
                    row.creditAccount,
                    row.creditAmount,
                ])
            ) {
                return;
            }

            const rowNumber = index + 1;
            drafts.push(
                {
                    field_name: `row${rowNumber}_debit_account`,
                    field_label: `Row ${rowNumber} Debit Account`,
                    expected_value: row.debitAccount.trim(),
                    options,
                    order_index: rowNumber * 10 + 1,
                },
                {
                    field_name: `row${rowNumber}_debit_amount`,
                    field_label: `Row ${rowNumber} Debit Amount`,
                    expected_value: row.debitAmount.trim(),
                    order_index: rowNumber * 10 + 2,
                },
                {
                    field_name: `row${rowNumber}_credit_account`,
                    field_label: `Row ${rowNumber} Credit Account`,
                    expected_value: row.creditAccount.trim(),
                    options,
                    order_index: rowNumber * 10 + 3,
                },
                {
                    field_name: `row${rowNumber}_credit_amount`,
                    field_label: `Row ${rowNumber} Credit Amount`,
                    expected_value: row.creditAmount.trim(),
                    order_index: rowNumber * 10 + 4,
                }
            );
        });

        await onSave(drafts);
    };

    const saveTrialBalance = async () => {
        const options = splitOptions(trialBalanceOptionsText);
        const drafts: SimulationFieldDraft[] = [];

        trialBalanceRows.forEach((row, index) => {
            if (isRowBlank([row.account, row.amount])) {
                return;
            }

            const rowNumber = index + 1;
            drafts.push(
                {
                    field_name: `row${rowNumber}_${row.side}_account`,
                    field_label: `Row ${rowNumber} ${row.side === "debit" ? "Debit" : "Credit"} Account`,
                    expected_value: row.account.trim(),
                    options,
                    order_index: rowNumber * 10 + 1,
                },
                {
                    field_name: `row${rowNumber}_${row.side}_amount`,
                    field_label: `Row ${rowNumber} ${row.side === "debit" ? "Debit" : "Credit"} Amount`,
                    expected_value: row.amount.trim(),
                    order_index: rowNumber * 10 + 2,
                }
            );
        });

        await onSave(drafts);
    };

    const saveFinancialStatement = async () => {
        const drafts: SimulationFieldDraft[] = [];
        let order = 1;

        for (const section of FINANCIAL_STATEMENT_SECTIONS) {
            const options = splitOptions(financialStatementOptions[section.key] ?? "");
            const rows = financialStatementRows[section.key] ?? [];

            rows.forEach((row, index) => {
                if (!row.account.trim() && !row.amount.trim()) {
                    return;
                }

                const rowNumber = index + 1;
                drafts.push(
                    {
                        field_name: `${section.key}_row${rowNumber}_account`,
                        field_label: `${section.label} Row ${rowNumber} Account`,
                        expected_value: row.account.trim(),
                        options,
                        order_index: order++,
                    },
                    {
                        field_name: `${section.key}_row${rowNumber}_amount`,
                        field_label: `${section.label} Row ${rowNumber} Amount`,
                        expected_value: row.amount.trim(),
                        order_index: order++,
                    }
                );
            });
        }

        await onSave(drafts);
    };

    const saveGeneric = async () => {
        const drafts = genericFields
            .filter((field) => field.field_name.trim())
            .map((field, index) => ({
                field_name: field.field_name.trim(),
                field_label: field.field_label.trim() || null,
                expected_value: field.expected_value.trim() || null,
                options: splitOptions(field.optionsText),
                order_index: parsePositiveInt(field.order_index) ?? index + 1,
            }));

        await onSave(drafts);
    };

    const registrationFieldOptions =
        simulatorType === "epan_registration" ? EPAN_FIELD_PATHS : ITR_FIELD_PATHS;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                        Configure ground-truth answers for each evaluated field.
                    </h3>
                    <p className="text-sm text-slate-500">
                        Use the simulator-specific template to keep field naming compatible with evaluation.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Task: {taskId ?? "Not created"}</Badge>
                    <Badge variant="outline">Step: {stepId ?? "Not created"}</Badge>
                    <Badge variant="secondary">{simulatorType ?? "none"}</Badge>
                </div>
            </div>

            {isLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    Loading simulation answers...
                </div>
            ) : (
                <>
                    {simulatorType === "classification" && !questionHasTable && (
                        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            <AlertCircle className="mt-0.5 h-4 w-4" />
                            Classification questions require an evidence table before answer rows can be configured.
                        </div>
                    )}

                    {(simulatorType === "journal_entry" ||
                        simulatorType === "ledger" ||
                        simulatorType === "trial_balance") &&
                        !questionHasTable && (
                            <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                <AlertCircle className="mt-0.5 h-4 w-4" />
                                This simulator is easier to configure when the evidence table rows match the expected transaction rows.
                            </div>
                        )}

                    {(simulatorType === "itr_registration" ||
                        simulatorType === "epan_registration") && (
                        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            {registrationRows.map((row, index) => (
                                <div
                                    key={`registration-row-${index}`}
                                    className="grid gap-3 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)_40px]"
                                >
                                    <select
                                        value={row.fieldPath}
                                        onChange={(event) =>
                                            setRegistrationRows((prev) =>
                                                prev.map((item, itemIndex) =>
                                                    itemIndex === index
                                                        ? { ...item, fieldPath: event.target.value }
                                                        : item
                                                )
                                            )
                                        }
                                        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">Select field path</option>
                                        {registrationFieldOptions.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                    <Input
                                        value={row.expectedValue}
                                        onChange={(event) =>
                                            setRegistrationRows((prev) =>
                                                prev.map((item, itemIndex) =>
                                                    itemIndex === index
                                                        ? {
                                                              ...item,
                                                              expectedValue: event.target.value,
                                                          }
                                                        : item
                                                )
                                            )
                                        }
                                        placeholder="Expected value"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon-sm"
                                        onClick={() =>
                                            setRegistrationRows((prev) =>
                                                prev.length > 1
                                                    ? prev.filter((_, itemIndex) => itemIndex !== index)
                                                    : prev
                                            )
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            <div className="flex flex-wrap gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setRegistrationRows((prev) => [
                                            ...prev,
                                            { fieldPath: "", expectedValue: "" },
                                        ])
                                    }
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Field
                                </Button>
                                <Button
                                    type="button"
                                    onClick={saveRegistration}
                                    disabled={
                                        isSaving ||
                                        new Set(
                                            registrationRows
                                                .map((row) => row.fieldPath.trim())
                                                .filter(Boolean)
                                        ).size !==
                                            registrationRows
                                                .map((row) => row.fieldPath.trim())
                                                .filter(Boolean).length
                                    }
                                >
                                    <Save className="h-4 w-4" />
                                    Save Answers
                                </Button>
                            </div>
                            {new Set(
                                registrationRows
                                    .map((row) => row.fieldPath.trim())
                                    .filter(Boolean)
                            ).size !==
                                registrationRows
                                    .map((row) => row.fieldPath.trim())
                                    .filter(Boolean).length && (
                                <p className="text-sm text-red-600">
                                    Each field path can only be used once.
                                </p>
                            )}
                        </div>
                    )}

                    {simulatorType === "classification" && (
                        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">
                                    Shared Options
                                </label>
                                <Input
                                    value={classificationOptionsText}
                                    onChange={(event) =>
                                        setClassificationOptionsText(event.target.value)
                                    }
                                    placeholder="Revenue, Capital, Asset, Liability, Expense"
                                />
                            </div>

                            <div className="space-y-3">
                                {classificationRows.map((row, index) => (
                                    <div
                                        key={`classification-row-${index}`}
                                        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_220px]"
                                    >
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Field Label
                                            </label>
                                            <Input
                                                value={row.fieldLabel}
                                                onChange={(event) =>
                                                    setClassificationRows((prev) =>
                                                        prev.map((item, itemIndex) =>
                                                            itemIndex === index
                                                                ? {
                                                                      ...item,
                                                                      fieldLabel: event.target.value,
                                                                  }
                                                                : item
                                                        )
                                                    )
                                                }
                                                placeholder={`Row ${index + 1}`}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                Expected Value
                                            </label>
                                            <Input
                                                value={row.expectedValue}
                                                onChange={(event) =>
                                                    setClassificationRows((prev) =>
                                                        prev.map((item, itemIndex) =>
                                                            itemIndex === index
                                                                ? {
                                                                      ...item,
                                                                      expectedValue: event.target.value,
                                                                  }
                                                                : item
                                                        )
                                                    )
                                                }
                                                placeholder="Correct classification"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button
                                type="button"
                                onClick={saveClassification}
                                disabled={isSaving || !questionHasTable}
                            >
                                <Save className="h-4 w-4" />
                                Save Answers
                            </Button>
                        </div>
                    )}

                    {(simulatorType === "journal_entry" || simulatorType === "ledger") && (
                        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">
                                    Account Options
                                </label>
                                <Input
                                    value={gridOptionsText}
                                    onChange={(event) => setGridOptionsText(event.target.value)}
                                    placeholder="Cash A/c, Capital A/c, Purchases A/c"
                                />
                            </div>
                            {gridRows.map((row, index) => (
                                <div
                                    key={`grid-row-${index}`}
                                    className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_40px]"
                                >
                                    <Input
                                        value={row.debitAccount}
                                        onChange={(event) =>
                                            setGridRows((prev) =>
                                                prev.map((item, itemIndex) =>
                                                    itemIndex === index
                                                        ? {
                                                              ...item,
                                                              debitAccount: event.target.value,
                                                          }
                                                        : item
                                                )
                                            )
                                        }
                                        placeholder={`Row ${index + 1} debit account`}
                                    />
                                    <Input
                                        value={row.debitAmount}
                                        onChange={(event) =>
                                            setGridRows((prev) =>
                                                prev.map((item, itemIndex) =>
                                                    itemIndex === index
                                                        ? {
                                                              ...item,
                                                              debitAmount: event.target.value,
                                                          }
                                                        : item
                                                )
                                            )
                                        }
                                        placeholder="Debit amount"
                                    />
                                    <Input
                                        value={row.creditAccount}
                                        onChange={(event) =>
                                            setGridRows((prev) =>
                                                prev.map((item, itemIndex) =>
                                                    itemIndex === index
                                                        ? {
                                                              ...item,
                                                              creditAccount: event.target.value,
                                                          }
                                                        : item
                                                )
                                            )
                                        }
                                        placeholder={`Row ${index + 1} credit account`}
                                    />
                                    <Input
                                        value={row.creditAmount}
                                        onChange={(event) =>
                                            setGridRows((prev) =>
                                                prev.map((item, itemIndex) =>
                                                    itemIndex === index
                                                        ? {
                                                              ...item,
                                                              creditAmount: event.target.value,
                                                          }
                                                        : item
                                                )
                                            )
                                        }
                                        placeholder="Credit amount"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon-sm"
                                        onClick={() =>
                                            setGridRows((prev) =>
                                                prev.length > 1
                                                    ? prev.filter(
                                                          (_, itemIndex) =>
                                                              itemIndex !== index
                                                      )
                                                    : prev
                                            )
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            <div className="flex flex-wrap gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setGridRows((prev) => [...prev, { ...EMPTY_GRID_ROW }])
                                    }
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Row
                                </Button>
                                <Button type="button" onClick={saveGrid} disabled={isSaving}>
                                    <Save className="h-4 w-4" />
                                    Save Answers
                                </Button>
                            </div>
                        </div>
                    )}

                    {simulatorType === "trial_balance" && (
                        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">
                                    Account Options
                                </label>
                                <Input
                                    value={trialBalanceOptionsText}
                                    onChange={(event) =>
                                        setTrialBalanceOptionsText(event.target.value)
                                    }
                                    placeholder="Cash A/c, Capital A/c, Sales A/c"
                                />
                            </div>

                            {trialBalanceRows.map((row, index) => (
                                <div
                                    key={`trial-balance-row-${index}`}
                                    className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_180px_180px_40px]"
                                >
                                    <Input
                                        value={row.account}
                                        onChange={(event) =>
                                            setTrialBalanceRows((prev) =>
                                                prev.map((item, itemIndex) =>
                                                    itemIndex === index
                                                        ? { ...item, account: event.target.value }
                                                        : item
                                                )
                                            )
                                        }
                                        placeholder={`Row ${index + 1} account`}
                                    />
                                    <select
                                        value={row.side}
                                        onChange={(event) =>
                                            setTrialBalanceRows((prev) =>
                                                prev.map((item, itemIndex) =>
                                                    itemIndex === index
                                                        ? {
                                                              ...item,
                                                              side: event.target.value as
                                                                  | "debit"
                                                                  | "credit",
                                                          }
                                                        : item
                                                )
                                            )
                                        }
                                        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="debit">Debit</option>
                                        <option value="credit">Credit</option>
                                    </select>
                                    <Input
                                        value={row.amount}
                                        onChange={(event) =>
                                            setTrialBalanceRows((prev) =>
                                                prev.map((item, itemIndex) =>
                                                    itemIndex === index
                                                        ? { ...item, amount: event.target.value }
                                                        : item
                                                )
                                            )
                                        }
                                        placeholder="Amount"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon-sm"
                                        onClick={() =>
                                            setTrialBalanceRows((prev) =>
                                                prev.length > 1
                                                    ? prev.filter(
                                                          (_, itemIndex) =>
                                                              itemIndex !== index
                                                      )
                                                    : prev
                                            )
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            <div className="flex flex-wrap gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setTrialBalanceRows((prev) => [
                                            ...prev,
                                            { ...EMPTY_TRIAL_BALANCE_ROW },
                                        ])
                                    }
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Row
                                </Button>
                                <Button type="button" onClick={saveTrialBalance} disabled={isSaving}>
                                    <Save className="h-4 w-4" />
                                    Save Answers
                                </Button>
                            </div>
                        </div>
                    )}

                    {simulatorType === "financial_statement" && (
                        <div className="space-y-4">
                            {FINANCIAL_STATEMENT_SECTIONS.map((section) => (
                                <div
                                    key={section.key}
                                    className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <h4 className="text-sm font-semibold text-slate-900">
                                            {section.label}
                                        </h4>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setFinancialStatementRows((prev) => ({
                                                    ...prev,
                                                    [section.key]: [
                                                        ...(prev[section.key] ?? []),
                                                        { account: "", amount: "" },
                                                    ],
                                                }))
                                            }
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Row
                                        </Button>
                                    </div>
                                    <Input
                                        value={financialStatementOptions[section.key] ?? ""}
                                        onChange={(event) =>
                                            setFinancialStatementOptions((prev) => ({
                                                ...prev,
                                                [section.key]: event.target.value,
                                            }))
                                        }
                                        placeholder="Account options for this section"
                                    />
                                    {(financialStatementRows[section.key] ?? []).map((row, index) => (
                                        <div
                                            key={`${section.key}-row-${index}`}
                                            className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_220px_40px]"
                                        >
                                            <Input
                                                value={row.account}
                                                onChange={(event) =>
                                                    setFinancialStatementRows((prev) => ({
                                                        ...prev,
                                                        [section.key]: (prev[section.key] ?? []).map(
                                                            (item, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...item,
                                                                          account: event.target.value,
                                                                      }
                                                                    : item
                                                        ),
                                                    }))
                                                }
                                                placeholder="Account name"
                                            />
                                            <Input
                                                value={row.amount}
                                                onChange={(event) =>
                                                    setFinancialStatementRows((prev) => ({
                                                        ...prev,
                                                        [section.key]: (prev[section.key] ?? []).map(
                                                            (item, itemIndex) =>
                                                                itemIndex === index
                                                                    ? {
                                                                          ...item,
                                                                          amount: event.target.value,
                                                                      }
                                                                    : item
                                                        ),
                                                    }))
                                                }
                                                placeholder="Amount"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon-sm"
                                                onClick={() =>
                                                    setFinancialStatementRows((prev) => ({
                                                        ...prev,
                                                        [section.key]:
                                                            (prev[section.key] ?? []).length > 1
                                                                ? (prev[section.key] ?? []).filter(
                                                                      (_, itemIndex) =>
                                                                          itemIndex !== index
                                                                  )
                                                                : prev[section.key] ?? [],
                                                    }))
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            ))}

                            <Button type="button" onClick={saveFinancialStatement} disabled={isSaving}>
                                <Save className="h-4 w-4" />
                                Save Answers
                            </Button>
                        </div>
                    )}

                    {(simulatorType === "none" || !simulatorType) && (
                        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            {genericFields.map((field, index) => (
                                <div
                                    key={field.id ?? `generic-${index}`}
                                    className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
                                >
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <Input
                                            value={field.field_name}
                                            onChange={(event) =>
                                                setGenericFields((prev) =>
                                                    prev.map((item, itemIndex) =>
                                                        itemIndex === index
                                                            ? {
                                                                  ...item,
                                                                  field_name: event.target.value,
                                                              }
                                                            : item
                                                    )
                                                )
                                            }
                                            placeholder="field_name"
                                        />
                                        <Input
                                            value={field.field_label}
                                            onChange={(event) =>
                                                setGenericFields((prev) =>
                                                    prev.map((item, itemIndex) =>
                                                        itemIndex === index
                                                            ? {
                                                                  ...item,
                                                                  field_label: event.target.value,
                                                              }
                                                            : item
                                                    )
                                                )
                                            }
                                            placeholder="field_label"
                                        />
                                        <Input
                                            value={field.expected_value}
                                            onChange={(event) =>
                                                setGenericFields((prev) =>
                                                    prev.map((item, itemIndex) =>
                                                        itemIndex === index
                                                            ? {
                                                                  ...item,
                                                                  expected_value: event.target.value,
                                                              }
                                                            : item
                                                    )
                                                )
                                            }
                                            placeholder="expected_value"
                                        />
                                        <Input
                                            value={field.order_index}
                                            onChange={(event) =>
                                                setGenericFields((prev) =>
                                                    prev.map((item, itemIndex) =>
                                                        itemIndex === index
                                                            ? {
                                                                  ...item,
                                                                  order_index: event.target.value,
                                                              }
                                                            : item
                                                    )
                                                )
                                            }
                                            placeholder="order_index"
                                        />
                                    </div>
                                    <Input
                                        value={field.optionsText}
                                        onChange={(event) =>
                                            setGenericFields((prev) =>
                                                prev.map((item, itemIndex) =>
                                                    itemIndex === index
                                                        ? {
                                                              ...item,
                                                              optionsText: event.target.value,
                                                          }
                                                        : item
                                                )
                                            )
                                        }
                                        placeholder="options (comma-separated)"
                                    />
                                    <div className="flex flex-wrap gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setGenericFields((prev) =>
                                                    prev.length > 1
                                                        ? prev.filter(
                                                              (_, itemIndex) => itemIndex !== index
                                                          )
                                                        : prev
                                                )
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Remove Row
                                        </Button>
                                        {field.id && (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                onClick={() => onDeleteField(field.id!)}
                                                disabled={isSaving}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete Saved Field
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <Separator />

                            <div className="flex flex-wrap gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setGenericFields((prev) => [
                                            ...prev,
                                            {
                                                field_name: "",
                                                field_label: "",
                                                expected_value: "",
                                                optionsText: "",
                                                order_index: `${prev.length + 1}`,
                                            },
                                        ])
                                    }
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Field
                                </Button>
                                <Button type="button" onClick={saveGeneric} disabled={isSaving}>
                                    <Save className="h-4 w-4" />
                                    Save Answers
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
