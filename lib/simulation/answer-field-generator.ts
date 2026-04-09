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
const GRID_DESCRIPTION_FIELD_PATTERN = /^row(\d+)_description$/i;
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

const FALLBACK_REGISTRATION_FIELD_DEFINITIONS: Record<
    RegistrationSimulatorType,
    SimulationFieldDefinition[]
> = {
    itr_registration: [
        ["registerAs", "Register As", "Registration"],
        ["pan", "PAN", "Registration"],
        ["personalDetails.firstName", "First Name", "Personal Details"],
        ["personalDetails.middleName", "Middle Name", "Personal Details"],
        ["personalDetails.lastName", "Last Name", "Personal Details"],
        ["personalDetails.dob", "Date of Birth", "Personal Details"],
        ["personalDetails.gender", "Gender", "Personal Details"],
        ["personalDetails.residentialStatus", "Residential Status", "Personal Details"],
        ["addressDetails.flatDoorNo", "Flat / Door No", "Address Details"],
        ["addressDetails.road", "Road", "Address Details"],
        ["addressDetails.area", "Area", "Address Details"],
        ["addressDetails.postOffice", "Post Office", "Address Details"],
        ["addressDetails.city", "City", "Address Details"],
        ["addressDetails.state", "State", "Address Details"],
        ["addressDetails.pincode", "Pincode", "Address Details"],
        ["contactDetails.mobile", "Mobile", "Contact Details"],
        ["contactDetails.email", "Email", "Contact Details"],
        ["contactDetails.alternateContact", "Alternate Contact", "Contact Details"],
        ["contactDetails.mobileBelongsTo", "Mobile Belongs To", "Contact Details"],
        ["contactDetails.emailBelongsTo", "Email Belongs To", "Contact Details"],
    ].map(([fieldName, fieldLabel, fieldGroup], index) => ({
        simulatorType: "itr_registration",
        fieldName,
        fieldLabel,
        fieldGroup,
        inputType: "text",
        sortOrder: index + 1,
        isActive: true,
        helpText: null,
    })),
    epan_registration: [
        ["fullName", "Full Name", "Personal Details"],
        ["dob", "Date of Birth", "Personal Details"],
        ["gender", "Gender", "Personal Details"],
        ["mobile", "Mobile", "Contact Details"],
        ["email", "Email", "Contact Details"],
        ["address", "Address", "Address Details"],
        ["aadhaarNumber", "Aadhaar Number", "Verification"],
    ].map(([fieldName, fieldLabel, fieldGroup], index) => ({
        simulatorType: "epan_registration",
        fieldName,
        fieldLabel,
        fieldGroup,
        inputType: "text",
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

function capitalize(value: string): string {
    return value ? value[0].toUpperCase() + value.slice(1) : value;
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
                        field_label: `Row ${rowNumber} Description`,
                        expected_value: trimValue(row.transactionDesc),
                        options: null,
                        order_index: orderBase + 1,
                    },
                    {
                        step_id: stepId,
                        field_name: `row${rowNumber}_debit_account`,
                        field_label: `Row ${rowNumber} Debit Account`,
                        expected_value: trimValue(row.drAccount),
                        options: accountOptions,
                        order_index: orderBase + 2,
                    },
                    {
                        step_id: stepId,
                        field_name: `row${rowNumber}_debit_amount`,
                        field_label: `Row ${rowNumber} Debit Amount`,
                        expected_value: normalizeAmount(row.drAmount),
                        options: null,
                        order_index: orderBase + 3,
                    },
                    {
                        step_id: stepId,
                        field_name: `row${rowNumber}_credit_account`,
                        field_label: `Row ${rowNumber} Credit Account`,
                        expected_value: trimValue(row.crAccount),
                        options: accountOptions,
                        order_index: orderBase + 4,
                    },
                    {
                        step_id: stepId,
                        field_name: `row${rowNumber}_credit_amount`,
                        field_label: `Row ${rowNumber} Credit Amount`,
                        expected_value: normalizeAmount(row.crAmount),
                        options: null,
                        order_index: orderBase + 5,
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
                .map((field, index) => {
                    const normalizedFieldPath = normalizeRegistrationFieldPath(
                        "itr_registration",
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
                        field_label:
                            matchedDefinition?.fieldLabel ??
                            fieldPathToLabel(normalizedFieldPath),
                        expected_value: trimValue(field.expectedValue),
                        options: null,
                        order_index: index + 1,
                    };
                });
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
    options?: {
        registrationFieldDefinitions?: SimulationFieldDefinition[] | null;
    },
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
            return reverseParseRegistration(
                fields,
                resolveRegistrationFieldDefinitions(
                    simulatorType,
                    options?.registrationFieldDefinitions,
                ),
            );
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
                trimValue(tableData?.rows?.[rowNumber - 1]?.[1]);
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

    if (rows.size === 0) {
        return null;
    }

    const maxRowNumber = Math.max(...rows.keys());

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
    definitions: SimulationFieldDefinition[],
): RegistrationPayload | null {
    const allowedDefinitions = new Map(
        definitions.map((definition) => {
            const normalizedFieldName = normalizeRegistrationFieldPath(
                "itr_registration",
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
                "itr_registration",
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
