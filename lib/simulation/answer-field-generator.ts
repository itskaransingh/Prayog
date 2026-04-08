export type SimulatorType =
    | "none"
    | "classification"
    | "itr_registration"
    | "epan_registration"
    | "journal_entry"
    | "ledger"
    | "trial_balance"
    | "financial_statement";

export interface QuestionTableData {
    headers?: string[];
    rows?: string[][];
}

export interface SimulationFieldInsert {
    step_id: string;
    field_name: string;
    field_label: string | null;
    expected_value: string | null;
    options: string[] | null;
    order_index: number;
}

export interface SimulationFieldRecord {
    id?: string;
    step_id?: string | null;
    field_name: string | null;
    field_label: string | null;
    expected_value: string | null;
    options?: string[] | null;
    order_index?: number | null;
}

export interface ClassificationPayload {
    type: "classification";
    options: string[];
    rows: { label: string; expected: string }[];
}

export interface GridPayload {
    type: "grid";
    accountOptions: string[];
    rows: {
        transactionDesc: string;
        drAccount: string;
        drAmount: string;
        crAccount: string;
        crAmount: string;
    }[];
}

export interface TrialBalancePayload {
    type: "trial_balance";
    accountOptions: string[];
    rows: {
        account: string;
        side: "debit" | "credit";
        amount: string;
    }[];
}

export interface FinancialStatementPayload {
    type: "financial_statement";
    sections: {
        sectionKey: FinancialStatementSectionKey;
        options: string[];
        rows: { account: string; amount: string }[];
    }[];
}

export interface RegistrationPayload {
    type: "registration";
    fields: {
        fieldPath: string;
        expectedValue: string;
    }[];
}

export type SyncAnswersPayload =
    | ClassificationPayload
    | GridPayload
    | TrialBalancePayload
    | FinancialStatementPayload
    | RegistrationPayload;

export type FinancialStatementSectionKey =
    | "pl_direct_expense"
    | "pl_direct_income"
    | "pl_indirect_expense"
    | "pl_indirect_income"
    | "bs_capital"
    | "bs_ncl"
    | "bs_cl"
    | "bs_ppe"
    | "bs_onca"
    | "bs_ca";

const CLASSIFICATION_FIELD_PATTERN = /^row(\d+)_classification$/i;
const GRID_FIELD_PATTERN = /^row(\d+)_(debit|credit)_(account|amount)$/i;
const TRIAL_BALANCE_FIELD_PATTERN = /^row(\d+)_(debit|credit)_(account|amount)$/i;
const FS_FIELD_PATTERN =
    /^(pl_direct_expense|pl_direct_income|pl_indirect_expense|pl_indirect_income|bs_capital|bs_ncl|bs_cl|bs_ppe|bs_onca|bs_ca)_row(\d+)_(account|amount)$/i;

const FINANCIAL_STATEMENT_SECTION_ORDER: FinancialStatementSectionKey[] = [
    "pl_direct_expense",
    "pl_direct_income",
    "pl_indirect_expense",
    "pl_indirect_income",
    "bs_capital",
    "bs_ncl",
    "bs_cl",
    "bs_ppe",
    "bs_onca",
    "bs_ca",
];

function trimValue(value: string | null | undefined): string {
    return (value ?? "").trim();
}

function normalizeAmount(value: string | null | undefined): string {
    return trimValue(value).replaceAll(",", "");
}

function normalizeOptions(options: string[] | null | undefined): string[] {
    return (options ?? []).map((option) => option.trim()).filter(Boolean);
}

function hasAnyValue(values: Array<string | null | undefined>): boolean {
    return values.some((value) => trimValue(value).length > 0);
}

function capitalize(value: string): string {
    return value ? value[0].toUpperCase() + value.slice(1) : value;
}

export function fieldPathToLabel(fieldPath: string): string {
    const lastSegment = fieldPath.split(".").at(-1) ?? fieldPath;
    const withSpaces = lastSegment.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
    return withSpaces.replace(/^./, (character) => character.toUpperCase());
}

export function sectionKeyToLabel(sectionKey: FinancialStatementSectionKey): string {
    switch (sectionKey) {
        case "pl_direct_expense":
            return "P&L Direct Expense";
        case "pl_direct_income":
            return "P&L Direct Income";
        case "pl_indirect_expense":
            return "P&L Indirect Expense";
        case "pl_indirect_income":
            return "P&L Indirect Income";
        case "bs_capital":
            return "Balance Sheet Capital";
        case "bs_ncl":
            return "Balance Sheet Non-Current Liabilities";
        case "bs_cl":
            return "Balance Sheet Current Liabilities";
        case "bs_ppe":
            return "Balance Sheet Property, Plant & Equipment";
        case "bs_onca":
            return "Balance Sheet Other Non-Current Assets";
        case "bs_ca":
            return "Balance Sheet Current Assets";
    }
}

export function generateFields(
    stepId: string,
    payload: SyncAnswersPayload,
): SimulationFieldInsert[] {
    switch (payload.type) {
        case "classification":
            return payload.rows
                .map((row, index) => ({
                    row,
                    index,
                }))
                .filter(({ row }) => hasAnyValue([row.label, row.expected]))
                .map(({ row, index }) => ({
                    step_id: stepId,
                    field_name: `row${index + 1}_classification`,
                    field_label: trimValue(row.label) || `Row ${index + 1}`,
                    expected_value: trimValue(row.expected),
                    options: normalizeOptions(payload.options),
                    order_index: index + 1,
                }));
        case "grid":
            return payload.rows.flatMap((row, index) => {
                if (
                    !hasAnyValue([
                        row.drAccount,
                        row.drAmount,
                        row.crAccount,
                        row.crAmount,
                    ])
                ) {
                    return [];
                }

                const rowNumber = index + 1;
                const orderBase = index * 4;
                const accountOptions = normalizeOptions(payload.accountOptions);

                return [
                    {
                        step_id: stepId,
                        field_name: `row${rowNumber}_debit_account`,
                        field_label: `Row ${rowNumber} Debit Account`,
                        expected_value: trimValue(row.drAccount),
                        options: accountOptions,
                        order_index: orderBase + 1,
                    },
                    {
                        step_id: stepId,
                        field_name: `row${rowNumber}_debit_amount`,
                        field_label: `Row ${rowNumber} Debit Amount`,
                        expected_value: normalizeAmount(row.drAmount),
                        options: null,
                        order_index: orderBase + 2,
                    },
                    {
                        step_id: stepId,
                        field_name: `row${rowNumber}_credit_account`,
                        field_label: `Row ${rowNumber} Credit Account`,
                        expected_value: trimValue(row.crAccount),
                        options: accountOptions,
                        order_index: orderBase + 3,
                    },
                    {
                        step_id: stepId,
                        field_name: `row${rowNumber}_credit_amount`,
                        field_label: `Row ${rowNumber} Credit Amount`,
                        expected_value: normalizeAmount(row.crAmount),
                        options: null,
                        order_index: orderBase + 4,
                    },
                ];
            });
        case "trial_balance":
            return payload.rows.flatMap((row, index) => {
                if (!hasAnyValue([row.account, row.amount])) {
                    return [];
                }

                const rowNumber = index + 1;
                const side = row.side;
                const accountOptions = normalizeOptions(payload.accountOptions);

                return [
                    {
                        step_id: stepId,
                        field_name: `row${rowNumber}_${side}_account`,
                        field_label: `Row ${rowNumber} ${capitalize(side)} Account`,
                        expected_value: trimValue(row.account),
                        options: accountOptions,
                        order_index: index * 2 + 1,
                    },
                    {
                        step_id: stepId,
                        field_name: `row${rowNumber}_${side}_amount`,
                        field_label: `Row ${rowNumber} ${capitalize(side)} Amount`,
                        expected_value: normalizeAmount(row.amount),
                        options: null,
                        order_index: index * 2 + 2,
                    },
                ];
            });
        case "financial_statement": {
            let orderIndex = 1;
            const sectionMap = new Map(
                payload.sections.map((section) => [section.sectionKey, section]),
            );

            return FINANCIAL_STATEMENT_SECTION_ORDER.flatMap((sectionKey) => {
                const section = sectionMap.get(sectionKey);
                if (!section) {
                    return [];
                }

                const options = normalizeOptions(section.options);

                return section.rows.flatMap((row, index) => {
                    if (!hasAnyValue([row.account, row.amount])) {
                        return [];
                    }

                    const rowNumber = index + 1;

                    return [
                        {
                            step_id: stepId,
                            field_name: `${sectionKey}_row${rowNumber}_account`,
                            field_label: `${sectionKeyToLabel(sectionKey)} Row ${rowNumber} Account`,
                            expected_value: trimValue(row.account),
                            options,
                            order_index: orderIndex++,
                        },
                        {
                            step_id: stepId,
                            field_name: `${sectionKey}_row${rowNumber}_amount`,
                            field_label: `${sectionKeyToLabel(sectionKey)} Row ${rowNumber} Amount`,
                            expected_value: normalizeAmount(row.amount),
                            options: null,
                            order_index: orderIndex++,
                        },
                    ];
                });
            });
        }
        case "registration":
            return payload.fields
                .filter((field) => trimValue(field.expectedValue).length > 0)
                .map((field, index) => ({
                    step_id: stepId,
                    field_name: trimValue(field.fieldPath),
                    field_label: fieldPathToLabel(field.fieldPath),
                    expected_value: trimValue(field.expectedValue),
                    options: null,
                    order_index: index + 1,
                }));
    }
}

export function buildEvidenceTable(
    payload: SyncAnswersPayload,
): QuestionTableData | null {
    switch (payload.type) {
        case "classification": {
            const rows = payload.rows
                .filter((row) => hasAnyValue([row.label, row.expected]))
                .map((row, index) => [String(index + 1), trimValue(row.label)]);

            return rows.length > 0
                ? {
                      headers: ["#", "Transaction / Item"],
                      rows,
                  }
                : null;
        }
        case "grid": {
            const rows = payload.rows
                .filter((row) =>
                    hasAnyValue([
                        row.transactionDesc,
                        row.drAccount,
                        row.drAmount,
                        row.crAccount,
                        row.crAmount,
                    ]),
                )
                .map((row, index) => [String(index + 1), trimValue(row.transactionDesc)]);

            return rows.length > 0
                ? {
                      headers: ["#", "Transaction"],
                      rows,
                  }
                : null;
        }
        default:
            return null;
    }
}

export function reverseParseFields(
    fields: SimulationFieldRecord[],
    simulatorType: SimulatorType,
    tableData?: QuestionTableData | null,
): SyncAnswersPayload | null {
    switch (simulatorType) {
        case "classification":
            return reverseParseClassification(fields, tableData);
        case "journal_entry":
        case "ledger":
            return reverseParseGrid(fields, tableData);
        case "trial_balance":
            return reverseParseTrialBalance(fields);
        case "financial_statement":
            return reverseParseFinancialStatement(fields);
        case "itr_registration":
        case "epan_registration":
            return reverseParseRegistration(fields);
        case "none":
        default:
            return null;
    }
}

function reverseParseClassification(
    fields: SimulationFieldRecord[],
    tableData?: QuestionTableData | null,
): ClassificationPayload | null {
    const rows = fields
        .map((field) => {
            const match = (field.field_name ?? "").match(CLASSIFICATION_FIELD_PATTERN);
            if (!match) {
                return null;
            }

            const rowNumber = Number(match[1]);
            const tableLabel = tableData?.rows?.[rowNumber - 1]?.[1] ?? "";

            return {
                rowNumber,
                label: trimValue(field.field_label) || trimValue(tableLabel),
                expected: trimValue(field.expected_value),
            };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null)
        .sort((left, right) => left.rowNumber - right.rowNumber)
        .map(({ label, expected }) => ({ label, expected }));

    if (rows.length === 0) {
        return null;
    }

    const firstOptions = fields.find((field) => (field.options ?? []).length > 0)?.options;

    return {
        type: "classification",
        options: normalizeOptions(firstOptions),
        rows,
    };
}

function reverseParseGrid(
    fields: SimulationFieldRecord[],
    tableData?: QuestionTableData | null,
): GridPayload | null {
    const rows = new Map<
        number,
        {
            transactionDesc: string;
            drAccount: string;
            drAmount: string;
            crAccount: string;
            crAmount: string;
        }
    >();

    for (const field of fields) {
        const match = (field.field_name ?? "").match(GRID_FIELD_PATTERN);
        if (!match) {
            continue;
        }

        const rowNumber = Number(match[1]);
        const side = match[2].toLowerCase() as "debit" | "credit";
        const kind = match[3].toLowerCase() as "account" | "amount";

        const current = rows.get(rowNumber) ?? {
            transactionDesc: trimValue(tableData?.rows?.[rowNumber - 1]?.[1]),
            drAccount: "",
            drAmount: "",
            crAccount: "",
            crAmount: "",
        };

        if (side === "debit" && kind === "account") {
            current.drAccount = trimValue(field.expected_value);
        } else if (side === "debit" && kind === "amount") {
            current.drAmount = trimValue(field.expected_value);
        } else if (side === "credit" && kind === "account") {
            current.crAccount = trimValue(field.expected_value);
        } else if (side === "credit" && kind === "amount") {
            current.crAmount = trimValue(field.expected_value);
        }

        rows.set(rowNumber, current);
    }

    if (rows.size === 0 && !(tableData?.rows?.length)) {
        return null;
    }

    const maxRowNumber = Math.max(
        rows.size > 0 ? Math.max(...rows.keys()) : 0,
        tableData?.rows?.length ?? 0,
    );

    const parsedRows = Array.from({ length: maxRowNumber }, (_, index) => {
        const rowNumber = index + 1;
        return (
            rows.get(rowNumber) ?? {
                transactionDesc: trimValue(tableData?.rows?.[index]?.[1]),
                drAccount: "",
                drAmount: "",
                crAccount: "",
                crAmount: "",
            }
        );
    }).filter((row) =>
        hasAnyValue([
            row.transactionDesc,
            row.drAccount,
            row.drAmount,
            row.crAccount,
            row.crAmount,
        ]),
    );

    const firstOptions = fields.find((field) => (field.options ?? []).length > 0)?.options;

    return {
        type: "grid",
        accountOptions: normalizeOptions(firstOptions),
        rows: parsedRows,
    };
}

function reverseParseTrialBalance(
    fields: SimulationFieldRecord[],
): TrialBalancePayload | null {
    const rows = new Map<
        number,
        {
            account: string;
            side: "debit" | "credit";
            amount: string;
        }
    >();

    for (const field of fields) {
        const match = (field.field_name ?? "").match(TRIAL_BALANCE_FIELD_PATTERN);
        if (!match) {
            continue;
        }

        const rowNumber = Number(match[1]);
        const side = match[2].toLowerCase() as "debit" | "credit";
        const kind = match[3].toLowerCase() as "account" | "amount";

        const current = rows.get(rowNumber) ?? {
            account: "",
            side,
            amount: "",
        };

        current.side = side;
        if (kind === "account") {
            current.account = trimValue(field.expected_value);
        } else {
            current.amount = trimValue(field.expected_value);
        }

        rows.set(rowNumber, current);
    }

    if (rows.size === 0) {
        return null;
    }

    const firstOptions = fields.find((field) => (field.options ?? []).length > 0)?.options;

    return {
        type: "trial_balance",
        accountOptions: normalizeOptions(firstOptions),
        rows: [...rows.entries()]
            .sort(([left], [right]) => left - right)
            .map(([, row]) => row),
    };
}

function reverseParseFinancialStatement(
    fields: SimulationFieldRecord[],
): FinancialStatementPayload | null {
    const sections = new Map<
        FinancialStatementSectionKey,
        {
            sectionKey: FinancialStatementSectionKey;
            options: string[];
            rows: Map<number, { account: string; amount: string }>;
        }
    >();

    for (const field of fields) {
        const match = (field.field_name ?? "").match(FS_FIELD_PATTERN);
        if (!match) {
            continue;
        }

        const sectionKey = match[1].toLowerCase() as FinancialStatementSectionKey;
        const rowNumber = Number(match[2]);
        const kind = match[3].toLowerCase() as "account" | "amount";

        const currentSection = sections.get(sectionKey) ?? {
            sectionKey,
            options: [],
            rows: new Map<number, { account: string; amount: string }>(),
        };

        if (kind === "account") {
            currentSection.options = normalizeOptions(field.options);
        }

        const currentRow = currentSection.rows.get(rowNumber) ?? {
            account: "",
            amount: "",
        };

        if (kind === "account") {
            currentRow.account = trimValue(field.expected_value);
        } else {
            currentRow.amount = trimValue(field.expected_value);
        }

        currentSection.rows.set(rowNumber, currentRow);
        sections.set(sectionKey, currentSection);
    }

    if (sections.size === 0) {
        return null;
    }

    return {
        type: "financial_statement",
        sections: FINANCIAL_STATEMENT_SECTION_ORDER.flatMap((sectionKey) => {
            const section = sections.get(sectionKey);
            if (!section) {
                return [];
            }

            const rows = [...section.rows.entries()]
                .sort(([left], [right]) => left - right)
                .map(([, row]) => row)
                .filter((row) => hasAnyValue([row.account, row.amount]));

            if (rows.length === 0) {
                return [];
            }

            return [
                {
                    sectionKey,
                    options: section.options,
                    rows,
                },
            ];
        }),
    };
}

function reverseParseRegistration(
    fields: SimulationFieldRecord[],
): RegistrationPayload | null {
    const parsedFields = fields
        .map((field) => ({
            fieldPath: trimValue(field.field_name),
            expectedValue: trimValue(field.expected_value),
            orderIndex: field.order_index ?? Number.MAX_SAFE_INTEGER,
        }))
        .filter((field) => field.fieldPath.length > 0)
        .sort((left, right) => left.orderIndex - right.orderIndex)
        .map(({ fieldPath, expectedValue }) => ({
            fieldPath,
            expectedValue,
        }));

    if (parsedFields.length === 0) {
        return null;
    }

    return {
        type: "registration",
        fields: parsedFields,
    };
}
