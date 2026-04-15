export type SimulatorType =
    | "none"
    | "classification"
    | "itr_registration"
    | "epan_registration"
    | "journal_entry"
    | "ledger"
    | "trial_balance"
    | "financial_statement"
    | "gstf-simulation";

export interface QuestionTableData {
    headers?: string[];
    rows?: string[][];
}

export interface SimulationFieldInsert {
    step_id: string;
    field_name: string;
    field_type: string;
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

export interface LegacyGridPayload {
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

export interface JournalEntryPayload {
    type: "journal_entry";
    accountOptions: string[];
    rows: {
        transactionDesc: string;
        lines: {
            side: "debit" | "credit";
            account: string;
            amount: string;
        }[];
    }[];
}

export interface LedgerPayload {
    type: "ledger";
    accountOptions: string[];
    rows: {
        transactionDesc: string;
        debitRows: {
            account: string;
            amount: string;
        }[];
        creditRows: {
            account: string;
            amount: string;
        }[];
    }[];
    debitRows?: {
        account: string;
        amount: string;
    }[];
    creditRows?: {
        account: string;
        amount: string;
    }[];
}

export type GridPayload = LegacyGridPayload;

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

export interface GstfSimulationPayload {
    type: "gstf-simulation";
    fields: {
        label: string;
        value: string;
    }[];
}

export type RegistrationSimulatorType = "itr_registration" | "epan_registration";

export interface SimulationFieldDefinition {
    id?: string;
    simulatorType: RegistrationSimulatorType;
    fieldName: string;
    fieldLabel: string;
    fieldGroup: string | null;
    inputType: string;
    sortOrder: number;
    isActive: boolean;
    helpText: string | null;
}

export type SyncAnswersPayload =
    | ClassificationPayload
    | LegacyGridPayload
    | JournalEntryPayload
    | LedgerPayload
    | TrialBalancePayload
    | FinancialStatementPayload
    | RegistrationPayload
    | GstfSimulationPayload;

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

const LEGACY_ITR_REGISTRATION_FIELD_PATHS: Record<string, string> = {
    firstName: "personalDetails.firstName",
    middleName: "personalDetails.middleName",
    lastName: "personalDetails.lastName",
    dob: "personalDetails.dob",
    gender: "personalDetails.gender",
    residentialStatus: "personalDetails.residentialStatus",
    flatDoorNo: "addressDetails.flatDoorNo",
    road: "addressDetails.road",
    area: "addressDetails.area",
    postOffice: "addressDetails.postOffice",
    city: "addressDetails.city",
    state: "addressDetails.state",
    pincode: "addressDetails.pincode",
    mobile: "contactDetails.mobile",
    email: "contactDetails.email",
    alternateContact: "contactDetails.alternateContact",
    mobileBelongsTo: "contactDetails.mobileBelongsTo",
    emailBelongsTo: "contactDetails.emailBelongsTo",
};

const CLASSIFICATION_FIELD_PATTERN = /^row(\d+)_classification$/i;
const LEGACY_CLASSIFICATION_FIELD_PATTERN = /^field_(\d+)$/i;
const GRID_DESCRIPTION_FIELD_PATTERN = /^row(\d+)_description$/i;
const GRID_FIELD_PATTERN = /^row(\d+)_(debit|credit)_(account|amount)$/i;
const JOURNAL_LINE_FIELD_PATTERN = /^row(\d+)_(debit|credit)(\d+)_(account|amount)$/i;
const TRIAL_BALANCE_FIELD_PATTERN = /^row(\d+)_(debit|credit)_(account|amount)$/i;
const LEGACY_BALANCE_ACCOUNT_FIELD_PATTERN = /^row(\d+)_account$/i;
const LEGACY_BALANCE_AMOUNT_FIELD_PATTERN = /^row(\d+)_(debit|credit)_amount$/i;
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

const FALLBACK_REGISTRATION_FIELD_DEFINITIONS: Record<
    RegistrationSimulatorType,
    SimulationFieldDefinition[]
> = {
    itr_registration: [
        ["registerAs", "Register As", "Registration", "radio"],
        ["pan", "PAN", "Registration", "text"],
        ["personalDetails.firstName", "First Name", "Personal Details", "text"],
        ["personalDetails.middleName", "Middle Name", "Personal Details", "text"],
        ["personalDetails.lastName", "Last Name", "Personal Details", "text"],
        ["personalDetails.dob", "Date of Birth", "Personal Details", "date"],
        ["personalDetails.gender", "Gender", "Personal Details", "radio"],
        ["personalDetails.residentialStatus", "Residential Status", "Personal Details", "select"],
        ["addressDetails.flatDoorNo", "Flat / Door No", "Address Details", "text"],
        ["addressDetails.road", "Road", "Address Details", "text"],
        ["addressDetails.area", "Area", "Address Details", "text"],
        ["addressDetails.postOffice", "Post Office", "Address Details", "text"],
        ["addressDetails.city", "City", "Address Details", "text"],
        ["addressDetails.state", "State", "Address Details", "select"],
        ["addressDetails.pincode", "Pincode", "Address Details", "text"],
        ["contactDetails.mobile", "Mobile", "Contact Details", "text"],
        ["contactDetails.email", "Email", "Contact Details", "text"],
        ["contactDetails.alternateContact", "Alternate Contact", "Contact Details", "text"],
        ["contactDetails.mobileBelongsTo", "Mobile Belongs To", "Contact Details", "radio"],
        ["contactDetails.emailBelongsTo", "Email Belongs To", "Contact Details", "radio"],
    ].map(([fieldName, fieldLabel, fieldGroup, inputType], index) => ({
        simulatorType: "itr_registration",
        fieldName,
        fieldLabel,
        fieldGroup,
        inputType,
        sortOrder: index + 1,
        isActive: true,
        helpText: null,
    })),
    epan_registration: [
        ["fullName", "Full Name", "Personal Details", "text"],
        ["dob", "Date of Birth", "Personal Details", "date"],
        ["gender", "Gender", "Personal Details", "radio"],
        ["mobile", "Mobile", "Contact Details", "text"],
        ["email", "Email", "Contact Details", "text"],
        ["address", "Address", "Address Details", "text"],
        ["aadhaarNumber", "Aadhaar Number", "Verification", "text"],
    ].map(([fieldName, fieldLabel, fieldGroup, inputType], index) => ({
        simulatorType: "epan_registration",
        fieldName,
        fieldLabel,
        fieldGroup,
        inputType,
        sortOrder: index + 1,
        isActive: true,
        helpText: null,
    })),
};

function trimValue(value: string | null | undefined): string {
    return (value ?? "").trim();
}

function normalizeAmount(value: string | null | undefined): string {
    return trimValue(value).replaceAll(",", "");
}

function amountAsNumber(value: string | null | undefined): number {
    const normalized = normalizeAmount(value);
    if (!normalized) {
        return 0;
    }

    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeOptions(options: string[] | null | undefined): string[] {
    return (options ?? []).map((option) => option.trim()).filter(Boolean);
}

export function normalizeRegistrationFieldPath(
    simulatorType: RegistrationSimulatorType,
    fieldPath: string,
): string {
    const trimmedPath = trimValue(fieldPath);

    if (simulatorType !== "itr_registration") {
        return trimmedPath;
    }

    return LEGACY_ITR_REGISTRATION_FIELD_PATHS[trimmedPath] ?? trimmedPath;
}

function hasAnyValue(values: Array<string | null | undefined>): boolean {
    return values.some((value) => trimValue(value).length > 0);
}

function normalizeJournalLines(
    lines: JournalEntryPayload["rows"][number]["lines"],
) {
    return lines.filter((line) => hasAnyValue([line.account, line.amount]));
}

function normalizeLedgerRows(rows?: { account: string; amount: string }[]) {
    return (rows ?? []).filter((row) => hasAnyValue([row.account, row.amount]));
}

function normalizeLedgerTransactions(payload: LedgerPayload) {
    const normalizedRows = payload.rows
        .map((row) => ({
            transactionDesc: trimValue(row.transactionDesc),
            debitRows: normalizeLedgerRows(row.debitRows),
            creditRows: normalizeLedgerRows(row.creditRows),
        }))
        .filter(
            (row) =>
                hasAnyValue([row.transactionDesc]) ||
                row.debitRows.length > 0 ||
                row.creditRows.length > 0,
        );

    if (normalizedRows.length > 0) {
        return normalizedRows;
    }

    const legacyDebitRows = normalizeLedgerRows(payload.debitRows);
    const legacyCreditRows = normalizeLedgerRows(payload.creditRows);
    const legacyLength = Math.max(legacyDebitRows.length, legacyCreditRows.length);

    return Array.from({ length: legacyLength }, (_, index) => ({
        transactionDesc: "",
        debitRows: legacyDebitRows[index] ? [legacyDebitRows[index]] : [],
        creditRows: legacyCreditRows[index] ? [legacyCreditRows[index]] : [],
    })).filter(
        (row) =>
            hasAnyValue([row.transactionDesc]) ||
            row.debitRows.length > 0 ||
            row.creditRows.length > 0,
    );
}

function getTableRowDescription(
    tableData: QuestionTableData | null | undefined,
    rowIndex: number,
): string {
    const row = tableData?.rows?.[rowIndex] ?? [];
    const headers = tableData?.headers ?? [];

    const labelHeaderIndex = headers.findIndex((header) =>
        /transaction|item|particular/i.test(trimValue(header)),
    );
    if (labelHeaderIndex >= 0) {
        return trimValue(row[labelHeaderIndex]);
    }

    if (row.length >= 3) {
        return trimValue(row[2]);
    }

    if (row.length >= 2) {
        return trimValue(row[1]);
    }

    return trimValue(row[0]);
}

function capitalize(value: string): string {
    return value ? value[0].toUpperCase() + value.slice(1) : value;
}

function normalizeFieldType(value: string | null | undefined): string {
    const normalized = trimValue(value).toLowerCase();

    switch (normalized) {
        case "dropdown":
        case "select":
        case "radio":
        case "date":
        case "number":
        case "text":
            return normalized;
        default:
            return "text";
    }
}

export function fieldPathToLabel(fieldPath: string): string {
    const lastSegment = fieldPath.split(".").at(-1) ?? fieldPath;
    const withSpaces = lastSegment.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
    return withSpaces.replace(/^./, (character) => character.toUpperCase());
}

export function isRegistrationSimulatorType(
    simulatorType: string | null | undefined,
): simulatorType is RegistrationSimulatorType {
    return (
        simulatorType === "itr_registration" || simulatorType === "epan_registration"
    );
}

export function getFallbackRegistrationFieldDefinitions(
    simulatorType: RegistrationSimulatorType,
): SimulationFieldDefinition[] {
    return FALLBACK_REGISTRATION_FIELD_DEFINITIONS[simulatorType].map(
        (definition) => ({
            ...definition,
        }),
    );
}

export function resolveRegistrationFieldDefinitions(
    simulatorType: RegistrationSimulatorType,
    definitions?: SimulationFieldDefinition[] | null,
): SimulationFieldDefinition[] {
    const normalizedDefinitions = (definitions ?? [])
        .filter(
            (definition) =>
                definition.simulatorType === simulatorType && definition.isActive,
        )
        .map((definition) => ({
            ...definition,
            fieldName: normalizeRegistrationFieldPath(
                simulatorType,
                definition.fieldName,
            ),
        }))
        .sort((left, right) => {
            if (left.sortOrder !== right.sortOrder) {
                return left.sortOrder - right.sortOrder;
            }

            return left.fieldName.localeCompare(right.fieldName);
        });

    if (normalizedDefinitions.length > 0) {
        return normalizedDefinitions;
    }

    return getFallbackRegistrationFieldDefinitions(simulatorType);
}

export function normalizeSimulationFieldDefinitions(
    records: Array<{
        id?: string | null;
        simulator_type?: string | null;
        field_name?: string | null;
        field_label?: string | null;
        field_group?: string | null;
        input_type?: string | null;
        sort_order?: number | null;
        is_active?: boolean | null;
        help_text?: string | null;
    }>,
): SimulationFieldDefinition[] {
    const definitions = new Map<string, SimulationFieldDefinition>();

    for (const record of records) {
        if (!isRegistrationSimulatorType(record.simulator_type)) {
            continue;
        }

        const simulatorType = record.simulator_type;
        const fieldName = normalizeRegistrationFieldPath(
            simulatorType,
            trimValue(record.field_name),
        );
        if (!fieldName) {
            continue;
        }

        definitions.set(`${simulatorType}:${fieldName}`, {
            id: trimValue(record.id ?? undefined) || undefined,
            simulatorType,
            fieldName,
            fieldLabel: trimValue(record.field_label) || fieldPathToLabel(fieldName),
            fieldGroup: trimValue(record.field_group) || null,
            inputType: trimValue(record.input_type) || "text",
            sortOrder:
                typeof record.sort_order === "number" &&
                Number.isFinite(record.sort_order)
                    ? record.sort_order
                    : Number.MAX_SAFE_INTEGER,
            isActive: record.is_active !== false,
            helpText: trimValue(record.help_text) || null,
        });
    }

    return [...definitions.values()].sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
            return left.sortOrder - right.sortOrder;
        }

        return left.fieldName.localeCompare(right.fieldName);
    });
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
    options?: {
        registrationFieldDefinitions?: SimulationFieldDefinition[] | null;
        simulatorType?: RegistrationSimulatorType | null;
    },
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
                    field_type: "dropdown",
                    field_label: trimValue(row.label) || `Row ${index + 1}`,
                    expected_value: trimValue(row.expected),
                    options: normalizeOptions(payload.options),
                    order_index: index + 1,
                }));
        case "grid":
            return payload.rows.flatMap((row, index) => {
                if (
                    !hasAnyValue([
                        row.transactionDesc,
                        row.drAccount,
                        row.drAmount,
                        row.crAccount,
                        row.crAmount,
                    ])
                ) {
                    return [];
                }

                const rowNumber = index + 1;
                const orderBase = index * 5;
                const accountOptions = normalizeOptions(payload.accountOptions);

                return [
                    {
                        step_id: stepId,
                        field_name: `row${rowNumber}_description`,
                        field_type: "text",
                        field_label: `Row ${rowNumber} Description`,
                        expected_value: trimValue(row.transactionDesc),
                        options: null,
                        order_index: orderBase + 1,
                    },
                    {
                        step_id: stepId,
                        field_name: `row${rowNumber}_debit_account`,
                        field_type: "dropdown",
                        field_label: `Row ${rowNumber} Debit Account`,
                        expected_value: trimValue(row.drAccount),
                        options: accountOptions,
                        order_index: orderBase + 2,
                    },
                    {
                        step_id: stepId,
                        field_name: `row${rowNumber}_debit_amount`,
                        field_type: "number",
                        field_label: `Row ${rowNumber} Debit Amount`,
                        expected_value: normalizeAmount(row.drAmount),
                        options: null,
                        order_index: orderBase + 3,
                    },
                    {
                        step_id: stepId,
                        field_name: `row${rowNumber}_credit_account`,
                        field_type: "dropdown",
                        field_label: `Row ${rowNumber} Credit Account`,
                        expected_value: trimValue(row.crAccount),
                        options: accountOptions,
                        order_index: orderBase + 4,
                    },
                    {
                        step_id: stepId,
                        field_name: `row${rowNumber}_credit_amount`,
                        field_type: "number",
                        field_label: `Row ${rowNumber} Credit Amount`,
                        expected_value: normalizeAmount(row.crAmount),
                        options: null,
                        order_index: orderBase + 5,
                    },
                ];
            });
        case "journal_entry": {
            let orderIndex = 1;

            return payload.rows.flatMap((row, index) => {
                const normalizedLines = normalizeJournalLines(row.lines);
                if (!hasAnyValue([row.transactionDesc]) && normalizedLines.length === 0) {
                    return [];
                }

                const rowNumber = index + 1;
                const accountOptions = normalizeOptions(payload.accountOptions);
                const fields: SimulationFieldInsert[] = [
                    {
                        step_id: stepId,
                        field_name: `row${rowNumber}_description`,
                        field_type: "text",
                        field_label: `Row ${rowNumber} Description`,
                        expected_value: trimValue(row.transactionDesc),
                        options: null,
                        order_index: orderIndex++,
                    },
                ];

                const sideCounters = {
                    debit: 0,
                    credit: 0,
                };

                for (const line of normalizedLines) {
                    sideCounters[line.side] += 1;
                    const lineNumber = sideCounters[line.side];

                    fields.push(
                        {
                            step_id: stepId,
                            field_name: `row${rowNumber}_${line.side}${lineNumber}_account`,
                            field_type: "dropdown",
                            field_label: `Row ${rowNumber} ${capitalize(line.side)} ${lineNumber} Account`,
                            expected_value: trimValue(line.account),
                            options: accountOptions,
                            order_index: orderIndex++,
                        },
                        {
                            step_id: stepId,
                            field_name: `row${rowNumber}_${line.side}${lineNumber}_amount`,
                            field_type: "number",
                            field_label: `Row ${rowNumber} ${capitalize(line.side)} ${lineNumber} Amount`,
                            expected_value: normalizeAmount(line.amount),
                            options: null,
                            order_index: orderIndex++,
                        },
                    );
                }

                return fields;
            });
        }
        case "ledger": {
            const accountOptions = normalizeOptions(payload.accountOptions);
            let orderIndex = 1;
            return normalizeLedgerTransactions(payload).flatMap((row, index) => {
                const rowNumber = index + 1;
                const fields: SimulationFieldInsert[] = [
                    {
                        step_id: stepId,
                        field_name: `row${rowNumber}_description`,
                        field_type: "text",
                        field_label: `Row ${rowNumber} Description`,
                        expected_value: trimValue(row.transactionDesc),
                        options: null,
                        order_index: orderIndex++,
                    },
                ];

                row.debitRows.forEach((line, lineIndex) => {
                    const lineNumber = lineIndex + 1;
                    fields.push(
                        {
                            step_id: stepId,
                            field_name: `row${rowNumber}_debit${lineNumber}_account`,
                            field_type: "dropdown",
                            field_label: `Row ${rowNumber} Debit ${lineNumber} Account`,
                            expected_value: trimValue(line.account),
                            options: accountOptions,
                            order_index: orderIndex++,
                        },
                        {
                            step_id: stepId,
                            field_name: `row${rowNumber}_debit${lineNumber}_amount`,
                            field_type: "number",
                            field_label: `Row ${rowNumber} Debit ${lineNumber} Amount`,
                            expected_value: normalizeAmount(line.amount),
                            options: null,
                            order_index: orderIndex++,
                        },
                    );
                });

                row.creditRows.forEach((line, lineIndex) => {
                    const lineNumber = lineIndex + 1;
                    fields.push(
                        {
                            step_id: stepId,
                            field_name: `row${rowNumber}_credit${lineNumber}_account`,
                            field_type: "dropdown",
                            field_label: `Row ${rowNumber} Credit ${lineNumber} Account`,
                            expected_value: trimValue(line.account),
                            options: accountOptions,
                            order_index: orderIndex++,
                        },
                        {
                            step_id: stepId,
                            field_name: `row${rowNumber}_credit${lineNumber}_amount`,
                            field_type: "number",
                            field_label: `Row ${rowNumber} Credit ${lineNumber} Amount`,
                            expected_value: normalizeAmount(line.amount),
                            options: null,
                            order_index: orderIndex++,
                        },
                    );
                });

                return fields;
            });
        }
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
                        field_type: "select",
                        field_label: `Row ${rowNumber} ${capitalize(side)} Account`,
                        expected_value: trimValue(row.account),
                        options: accountOptions,
                        order_index: index * 2 + 1,
                    },
                    {
                        step_id: stepId,
                        field_name: `row${rowNumber}_${side}_amount`,
                        field_type: "number",
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
                            field_type: "select",
                            field_label: `${sectionKeyToLabel(sectionKey)} Row ${rowNumber} Account`,
                            expected_value: trimValue(row.account),
                            options,
                            order_index: orderIndex++,
                        },
                        {
                            step_id: stepId,
                            field_name: `${sectionKey}_row${rowNumber}_amount`,
                            field_type: "number",
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
                .map((field, index) => {
                    const actualSimulatorType = options?.simulatorType ?? "itr_registration";
                    const normalizedFieldPath = normalizeRegistrationFieldPath(
                        actualSimulatorType,
                        field.fieldPath,
                    );
                    const matchedDefinition =
                        options?.registrationFieldDefinitions?.find(
                            (definition) =>
                                definition.fieldName === normalizedFieldPath,
                        ) ?? null;

                    return {
                        step_id: stepId,
                        field_name: normalizedFieldPath,
                        field_type: normalizeFieldType(matchedDefinition?.inputType),
                        field_label:
                            matchedDefinition?.fieldLabel ??
                            fieldPathToLabel(normalizedFieldPath),
                        expected_value: trimValue(field.expectedValue),
                        options: null,
                        order_index: index + 1,
                    };
                });
        case "gstf-simulation":
            return payload.fields
                .filter((field) => hasAnyValue([field.label, field.value]))
                .map((field, index) => ({
                    step_id: stepId,
                    field_name: `gstf_field_${index + 1}`,
                    field_type: "text",
                    field_label: trimValue(field.label) || `Field ${index + 1}`,
                    expected_value: trimValue(field.value),
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
        case "journal_entry": {
            const rows = payload.rows
                .filter((row) => hasAnyValue([row.transactionDesc]) || normalizeJournalLines(row.lines).length > 0)
                .map((row, index) => [String(index + 1), trimValue(row.transactionDesc)]);

            return rows.length > 0
                ? {
                      headers: ["#", "Transaction"],
                      rows,
                  }
                : null;
        }
        case "ledger": {
            const rows = normalizeLedgerTransactions(payload)
                .map((row, index) => [String(index + 1), trimValue(row.transactionDesc)])
                .filter((row) => hasAnyValue([row[1]]));

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
    options?: {
        registrationFieldDefinitions?: SimulationFieldDefinition[] | null;
    },
): SyncAnswersPayload | null {
    switch (simulatorType) {
        case "classification":
            return reverseParseClassification(fields, tableData);
        case "journal_entry":
            return reverseParseJournalEntry(fields, tableData);
        case "ledger":
            return reverseParseLedger(fields, tableData);
        case "trial_balance":
            return reverseParseTrialBalance(fields);
        case "financial_statement":
            return reverseParseFinancialStatement(fields);
        case "itr_registration":
        case "epan_registration":
            return reverseParseRegistration(
                fields,
                resolveRegistrationFieldDefinitions(
                    simulatorType,
                    options?.registrationFieldDefinitions,
                ),
                simulatorType,
            );
        case "gstf-simulation":
            return reverseParseGstfSimulation(fields);
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
            const fieldName = field.field_name ?? "";
            const match =
                fieldName.match(CLASSIFICATION_FIELD_PATTERN) ??
                fieldName.match(LEGACY_CLASSIFICATION_FIELD_PATTERN);
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
        const descriptionMatch = (field.field_name ?? "").match(
            GRID_DESCRIPTION_FIELD_PATTERN,
        );
        if (descriptionMatch) {
            const rowNumber = Number(descriptionMatch[1]);
            const current = rows.get(rowNumber) ?? {
                transactionDesc: "",
                drAccount: "",
                drAmount: "",
                crAccount: "",
                crAmount: "",
            };

            current.transactionDesc =
                trimValue(field.expected_value) ||
                getTableRowDescription(tableData, rowNumber - 1);
            rows.set(rowNumber, current);
            continue;
        }

        const match = (field.field_name ?? "").match(GRID_FIELD_PATTERN);
        if (!match) {
            continue;
        }

        const rowNumber = Number(match[1]);
        const side = match[2].toLowerCase() as "debit" | "credit";
        const kind = match[3].toLowerCase() as "account" | "amount";

        const current = rows.get(rowNumber) ?? {
            transactionDesc: getTableRowDescription(tableData, rowNumber - 1),
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

    // Backfill transactionDesc from tableData for questions saved before the
    // row{N}_description field was introduced (backward compatibility)
    if (tableData?.rows) {
        for (const [rowNumber, row] of rows.entries()) {
            if (!row.transactionDesc) {
                const legacyDesc = getTableRowDescription(tableData, rowNumber - 1);
                if (legacyDesc) {
                    row.transactionDesc = legacyDesc;
                }
            }
        }
    }

    if (rows.size === 0) {
        return null;
    }

    const maxRowNumber = Math.max(...rows.keys());

    const parsedRows = Array.from({ length: maxRowNumber }, (_, index) => {
        const rowNumber = index + 1;
        return (
            rows.get(rowNumber) ?? {
                transactionDesc: getTableRowDescription(tableData, index),
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

function reverseParseJournalEntry(
    fields: SimulationFieldRecord[],
    tableData?: QuestionTableData | null,
): JournalEntryPayload | null {
    const rows = new Map<
        number,
        {
            transactionDesc: string;
            lines: Map<string, { side: "debit" | "credit"; order: number; account: string; amount: string }>;
        }
    >();

    for (const field of fields) {
        const fieldName = field.field_name ?? "";
        const descriptionMatch = fieldName.match(GRID_DESCRIPTION_FIELD_PATTERN);
        if (descriptionMatch) {
            const rowNumber = Number(descriptionMatch[1]);
            const current = rows.get(rowNumber) ?? {
                transactionDesc: "",
                lines: new Map(),
            };
            current.transactionDesc =
                trimValue(field.expected_value) || getTableRowDescription(tableData, rowNumber - 1);
            rows.set(rowNumber, current);
            continue;
        }

        const journalMatch = fieldName.match(JOURNAL_LINE_FIELD_PATTERN);
        if (journalMatch) {
            const rowNumber = Number(journalMatch[1]);
            const side = journalMatch[2].toLowerCase() as "debit" | "credit";
            const order = Number(journalMatch[3]);
            const kind = journalMatch[4].toLowerCase() as "account" | "amount";
            const current = rows.get(rowNumber) ?? {
                transactionDesc: getTableRowDescription(tableData, rowNumber - 1),
                lines: new Map(),
            };
            const key = `${side}:${order}`;
            const line = current.lines.get(key) ?? { side, order, account: "", amount: "" };
            if (kind === "account") {
                line.account = trimValue(field.expected_value);
            } else {
                line.amount = trimValue(field.expected_value);
            }
            current.lines.set(key, line);
            rows.set(rowNumber, current);
            continue;
        }

        const legacyMatch = fieldName.match(GRID_FIELD_PATTERN);
        if (!legacyMatch) {
            continue;
        }

        const rowNumber = Number(legacyMatch[1]);
        const side = legacyMatch[2].toLowerCase() as "debit" | "credit";
        const kind = legacyMatch[3].toLowerCase() as "account" | "amount";
        const current = rows.get(rowNumber) ?? {
            transactionDesc: getTableRowDescription(tableData, rowNumber - 1),
            lines: new Map(),
        };
        const key = `${side}:1`;
        const line = current.lines.get(key) ?? { side, order: 1, account: "", amount: "" };
        if (kind === "account") {
            line.account = trimValue(field.expected_value);
        } else {
            line.amount = trimValue(field.expected_value);
        }
        current.lines.set(key, line);
        rows.set(rowNumber, current);
    }

    if (rows.size === 0) {
        return null;
    }

    const firstOptions = fields.find((field) => (field.options ?? []).length > 0)?.options;
    const maxRowNumber = Math.max(...rows.keys());
    const parsedRows = Array.from({ length: maxRowNumber }, (_, index) => {
        const rowNumber = index + 1;
        const row = rows.get(rowNumber);
        const lines = row
            ? [...row.lines.values()]
                  .sort((left, right) =>
                      left.side === right.side
                          ? left.order - right.order
                          : left.side.localeCompare(right.side),
                  )
                  .map(({ side, account, amount }) => ({ side, account, amount }))
            : [];

        return {
            transactionDesc: row?.transactionDesc ?? getTableRowDescription(tableData, index),
            lines,
        };
    }).filter((row) => hasAnyValue([row.transactionDesc]) || normalizeJournalLines(row.lines).length > 0);

    return {
        type: "journal_entry",
        accountOptions: normalizeOptions(firstOptions),
        rows: parsedRows,
    };
}

function reverseParseLedger(
    fields: SimulationFieldRecord[],
    tableData?: QuestionTableData | null,
): LedgerPayload | null {
    const journalStyleRows = new Map<
        number,
        {
            transactionDesc: string;
            debitRows: Map<number, { account: string; amount: string }>;
            creditRows: Map<number, { account: string; amount: string }>;
        }
    >();

    for (const field of fields) {
        const fieldName = field.field_name ?? "";
        const descriptionMatch = fieldName.match(/^row(\d+)_description$/i);
        if (descriptionMatch) {
            const rowNumber = Number(descriptionMatch[1]);
            const current = journalStyleRows.get(rowNumber) ?? {
                transactionDesc: getTableRowDescription(tableData, rowNumber - 1),
                debitRows: new Map(),
                creditRows: new Map(),
            };
            current.transactionDesc = trimValue(field.expected_value);
            journalStyleRows.set(rowNumber, current);
            continue;
        }

        const lineMatch = fieldName.match(/^row(\d+)_(debit|credit)(\d+)_(account|amount)$/i);
        if (!lineMatch) {
            continue;
        }

        const rowNumber = Number(lineMatch[1]);
        const side = lineMatch[2].toLowerCase() as "debit" | "credit";
        const lineNumber = Number(lineMatch[3]);
        const kind = lineMatch[4].toLowerCase() as "account" | "amount";
        const current = journalStyleRows.get(rowNumber) ?? {
            transactionDesc: getTableRowDescription(tableData, rowNumber - 1),
            debitRows: new Map(),
            creditRows: new Map(),
        };
        const targetRows = side === "debit" ? current.debitRows : current.creditRows;
        const targetRow = targetRows.get(lineNumber) ?? { account: "", amount: "" };
        targetRow[kind] = trimValue(field.expected_value);
        targetRows.set(lineNumber, targetRow);
        journalStyleRows.set(rowNumber, current);
    }

    if (journalStyleRows.size > 0) {
        const maxRowNumber = Math.max(...journalStyleRows.keys());
        const rows = Array.from({ length: maxRowNumber }, (_, index) => {
            const rowNumber = index + 1;
            const row = journalStyleRows.get(rowNumber);
            return {
                transactionDesc:
                    row?.transactionDesc ?? getTableRowDescription(tableData, index),
                debitRows: row
                    ? [...row.debitRows.entries()]
                          .sort((left, right) => left[0] - right[0])
                          .map(([, value]) => value)
                          .filter((value) => hasAnyValue([value.account, value.amount]))
                    : [],
                creditRows: row
                    ? [...row.creditRows.entries()]
                          .sort((left, right) => left[0] - right[0])
                          .map(([, value]) => value)
                          .filter((value) => hasAnyValue([value.account, value.amount]))
                    : [],
            };
        }).filter(
            (row) =>
                hasAnyValue([row.transactionDesc]) ||
                row.debitRows.length > 0 ||
                row.creditRows.length > 0,
        );

        return {
            type: "ledger",
            accountOptions: normalizeOptions(
                fields.find((field) => (field.options ?? []).length > 0)?.options,
            ),
            rows,
            debitRows: rows.flatMap((row) => row.debitRows),
            creditRows: rows.flatMap((row) => row.creditRows),
        };
    }

    const legacyGrid = reverseParseGrid(fields, tableData ?? null);
    if (!legacyGrid) {
        return null;
    }

    const rows = legacyGrid.rows
        .map((row) => ({
            transactionDesc: row.transactionDesc,
            debitRows: hasAnyValue([row.drAccount, row.drAmount])
                ? [{ account: row.drAccount, amount: row.drAmount }]
                : [],
            creditRows: hasAnyValue([row.crAccount, row.crAmount])
                ? [{ account: row.crAccount, amount: row.crAmount }]
                : [],
        }))
        .filter(
            (row) =>
                hasAnyValue([row.transactionDesc]) ||
                row.debitRows.length > 0 ||
                row.creditRows.length > 0,
        );

    return {
        type: "ledger",
        accountOptions: legacyGrid.accountOptions,
        rows,
        debitRows: rows.flatMap((row) => row.debitRows),
        creditRows: rows.flatMap((row) => row.creditRows),
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
        const legacyRows = reverseParseLegacyBalanceRows(fields);
        if (legacyRows.length === 0) {
            return null;
        }

        return {
            type: "trial_balance",
            accountOptions: normalizeOptions(
                Array.from(new Set(legacyRows.flatMap((row) => row.options))),
            ),
            rows: legacyRows.map((row) => ({
                account: row.account,
                side: row.side,
                amount: row.amount,
            })),
        };
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
        return reverseParseLegacyFinancialStatement(fields);
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

function reverseParseLegacyBalanceRows(
    fields: SimulationFieldRecord[],
): Array<{
    rowNumber: number;
    account: string;
    side: "debit" | "credit";
    amount: string;
    options: string[];
}> {
    const rows = new Map<
        number,
        {
            account: string;
            debitAmount: string;
            creditAmount: string;
            options: string[];
        }
    >();

    for (const field of fields) {
        const fieldName = field.field_name ?? "";
        const accountMatch = fieldName.match(LEGACY_BALANCE_ACCOUNT_FIELD_PATTERN);
        if (accountMatch) {
            const rowNumber = Number(accountMatch[1]);
            const current = rows.get(rowNumber) ?? {
                account: "",
                debitAmount: "",
                creditAmount: "",
                options: [],
            };
            current.account = trimValue(field.expected_value);
            current.options = normalizeOptions(field.options);
            rows.set(rowNumber, current);
            continue;
        }

        const amountMatch = fieldName.match(LEGACY_BALANCE_AMOUNT_FIELD_PATTERN);
        if (!amountMatch) {
            continue;
        }

        const rowNumber = Number(amountMatch[1]);
        const side = amountMatch[2].toLowerCase() as "debit" | "credit";
        const current = rows.get(rowNumber) ?? {
            account: "",
            debitAmount: "",
            creditAmount: "",
            options: [],
        };

        if (side === "debit") {
            current.debitAmount = trimValue(field.expected_value);
        } else {
            current.creditAmount = trimValue(field.expected_value);
        }

        rows.set(rowNumber, current);
    }

    return [...rows.entries()]
        .sort(([left], [right]) => left - right)
        .map(([rowNumber, row]) => {
            const debitAmount = normalizeAmount(row.debitAmount);
            const creditAmount = normalizeAmount(row.creditAmount);
            const debitValue = amountAsNumber(debitAmount);
            const creditValue = amountAsNumber(creditAmount);
            const side: "debit" | "credit" =
                creditValue > 0 && debitValue === 0
                    ? "credit"
                    : debitValue > 0
                      ? "debit"
                      : "debit";
            const amount = side === "credit" ? creditAmount : debitAmount || creditAmount;

            return {
                rowNumber,
                account: row.account,
                side,
                amount,
                options: row.options,
            };
        })
        .filter((row) => hasAnyValue([row.account, row.amount]));
}

function reverseParseLegacyFinancialStatement(
    fields: SimulationFieldRecord[],
): FinancialStatementPayload | null {
    const legacyRows = reverseParseLegacyBalanceRows(fields);
    if (legacyRows.length === 0) {
        return null;
    }

    const sections = new Map<
        FinancialStatementSectionKey,
        {
            sectionKey: FinancialStatementSectionKey;
            options: string[];
            rows: Array<{ account: string; amount: string }>;
        }
    >();

    for (const row of legacyRows) {
        const sectionKey = inferLegacyFinancialStatementSection(
            row.account,
            row.side,
            row.amount,
        );
        const currentSection = sections.get(sectionKey) ?? {
            sectionKey,
            options: [],
            rows: [],
        };

        currentSection.options = Array.from(
            new Set([...currentSection.options, ...row.options]),
        );
        currentSection.rows.push({
            account: row.account,
            amount: row.amount,
        });
        sections.set(sectionKey, currentSection);
    }

    return {
        type: "financial_statement",
        sections: FINANCIAL_STATEMENT_SECTION_ORDER.flatMap((sectionKey) => {
            const section = sections.get(sectionKey);
            if (!section || section.rows.length === 0) {
                return [];
            }

            return [section];
        }),
    };
}

function inferLegacyFinancialStatementSection(
    account: string,
    side: "debit" | "credit",
    amount: string,
): FinancialStatementSectionKey {
    const normalizedAccount = trimValue(account).toLowerCase();
    const normalizedAmount = amountAsNumber(amount);

    if (
        normalizedAccount.includes("capital") ||
        normalizedAccount.includes("drawings") ||
        normalizedAccount.includes("profit & loss")
    ) {
        return "bs_capital";
    }

    if (
        normalizedAccount.includes("loan") ||
        normalizedAccount.includes("mortgage") ||
        normalizedAccount.includes("debenture")
    ) {
        return "bs_ncl";
    }

    if (
        normalizedAccount.includes("creditor") ||
        normalizedAccount.includes("bills payable") ||
        normalizedAccount.includes("payable") ||
        normalizedAccount.includes("outstanding") ||
        normalizedAccount.includes("output cgst") ||
        normalizedAccount.includes("output sgst") ||
        normalizedAccount.includes("output igst") ||
        normalizedAccount.includes("tds payable")
    ) {
        return "bs_cl";
    }

    if (
        normalizedAccount.includes("building") ||
        normalizedAccount.includes("furniture") ||
        normalizedAccount.includes("machinery") ||
        normalizedAccount.includes("plant") ||
        normalizedAccount.includes("equipment") ||
        normalizedAccount.includes("vehicle")
    ) {
        return "bs_ppe";
    }

    if (
        normalizedAccount.includes("fixed deposit") ||
        normalizedAccount.includes("investment") ||
        normalizedAccount.includes("goodwill") ||
        normalizedAccount.includes("patent") ||
        normalizedAccount.includes("trademark")
    ) {
        return "bs_onca";
    }

    if (
        normalizedAccount.includes("cash") ||
        normalizedAccount.includes("bank") ||
        normalizedAccount.includes("debtor") ||
        normalizedAccount.includes("stock") ||
        normalizedAccount.includes("closing stock") ||
        normalizedAccount.includes("input cgst") ||
        normalizedAccount.includes("input sgst") ||
        normalizedAccount.includes("input igst")
    ) {
        return "bs_ca";
    }

    if (
        normalizedAccount.includes("sales") ||
        normalizedAccount.includes("closing stock") ||
        normalizedAccount.includes("purchase return")
    ) {
        return "pl_direct_income";
    }

    if (
        normalizedAccount.includes("purchase") ||
        normalizedAccount.includes("opening stock") ||
        normalizedAccount.includes("wages") ||
        normalizedAccount.includes("carriage inward")
    ) {
        return "pl_direct_expense";
    }

    if (
        normalizedAccount.includes("rent income") ||
        normalizedAccount.includes("rental income") ||
        normalizedAccount.includes("commission income") ||
        normalizedAccount.includes("dividend income") ||
        normalizedAccount.includes("interest income") ||
        normalizedAccount.includes("discount received")
    ) {
        return "pl_indirect_income";
    }

    if (
        normalizedAccount.includes("salary") ||
        normalizedAccount.includes("carriage outward") ||
        normalizedAccount.includes("insurance") ||
        normalizedAccount.includes("rent expense") ||
        normalizedAccount.includes("bad debts") ||
        normalizedAccount.includes("depreciation") ||
        normalizedAccount.includes("electricity")
    ) {
        return "pl_indirect_expense";
    }

    if (side === "credit") {
        return normalizedAmount > 0 ? "pl_indirect_income" : "bs_cl";
    }

    return "pl_indirect_expense";
}

function reverseParseRegistration(
    fields: SimulationFieldRecord[],
    definitions: SimulationFieldDefinition[],
    simulatorType: RegistrationSimulatorType,
): RegistrationPayload | null {
    const allowedDefinitions = new Map(
        definitions.map((definition) => {
            const normalizedFieldName = normalizeRegistrationFieldPath(
                definition.simulatorType,
                definition.fieldName,
            );

            return [
                normalizedFieldName,
                {
                    ...definition,
                    fieldName: normalizedFieldName,
                },
            ] as const;
        }),
    );

    const parsedFields = fields
        .map((field) => ({
            fieldPath: normalizeRegistrationFieldPath(
                simulatorType,
                trimValue(field.field_name),
            ),
            expectedValue: trimValue(field.expected_value),
            orderIndex: field.order_index ?? Number.MAX_SAFE_INTEGER,
        }))
        .filter(
            (field) =>
                field.fieldPath.length > 0 && allowedDefinitions.has(field.fieldPath),
        )
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

function reverseParseGstfSimulation(
    fields: SimulationFieldRecord[],
): GstfSimulationPayload | null {
    const parsedFields = fields
        .filter((field) =>
            hasAnyValue([field.field_label, field.expected_value, field.field_name]),
        )
        .sort(
            (left, right) =>
                (left.order_index ?? Number.MAX_SAFE_INTEGER) -
                (right.order_index ?? Number.MAX_SAFE_INTEGER),
        )
        .map((field, index) => ({
            label: trimValue(field.field_label) || `Field ${index + 1}`,
            value: trimValue(field.expected_value),
        }));

    if (parsedFields.length === 0) {
        return null;
    }

    return {
        type: "gstf-simulation",
        fields: parsedFields,
    };
}
