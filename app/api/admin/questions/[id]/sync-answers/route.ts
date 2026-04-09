import { NextResponse } from "next/server";

import {
    badRequest,
    internalServerError,
    notFound,
    requireAdmin,
    revalidateQuestionsTag,
} from "@/app/api/admin/simulation-route-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    buildEvidenceTable,
    generateFields,
    isRegistrationSimulatorType,
    normalizeSimulationFieldDefinitions,
    resolveRegistrationFieldDefinitions,
    type ClassificationPayload,
    type FinancialStatementPayload,
    type FinancialStatementSectionKey,
    type GridPayload,
    type JournalEntryPayload,
    type LedgerPayload,
    type RegistrationPayload,
    type SimulationFieldDefinition,
    type SimulationFieldInsert,
    type SimulatorType,
    type SyncAnswersPayload,
    type TrialBalancePayload,
} from "@/lib/simulation/answer-field-generator";
import type { QuestionType } from "@/lib/questions/types";

interface QuestionRecord {
    id: string;
    submodule_id: string;
    title: string;
    type: QuestionType;
}

interface SubmoduleRecord {
    id: string;
    is_active: boolean;
    simulator_type: SimulatorType | null;
}

interface ExistingSimulationFieldRecord extends SimulationFieldInsert {
    id: string;
}

async function loadRegistrationFieldDefinitions(
    adminDb: ReturnType<typeof createAdminClient>,
    simulatorType: SimulatorType | null,
): Promise<SimulationFieldDefinition[] | null> {
    if (!isRegistrationSimulatorType(simulatorType)) {
        return null;
    }

    const { data, error } = await adminDb
        .from("simulation_field_definitions")
        .select(
            "id, simulator_type, field_name, field_label, field_group, input_type, sort_order, is_active, help_text",
        )
        .eq("simulator_type", simulatorType)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("field_name", { ascending: true });

    if (error) {
        throw error;
    }

    return resolveRegistrationFieldDefinitions(
        simulatorType,
        normalizeSimulationFieldDefinitions(data ?? []),
    );
}

function validateRegistrationPayload(
    payload: RegistrationPayload,
    definitions: SimulationFieldDefinition[],
): string | null {
    const allowedFieldNames = new Set(
        definitions.map((definition) => definition.fieldName),
    );
    const seenFieldNames = new Set<string>();
    const duplicateFieldNames = new Set<string>();
    const unsupportedFieldNames = new Set<string>();

    for (const field of payload.fields) {
        const fieldPath = field.fieldPath.trim();
        if (!allowedFieldNames.has(fieldPath)) {
            unsupportedFieldNames.add(fieldPath);
        }

        if (seenFieldNames.has(fieldPath)) {
            duplicateFieldNames.add(fieldPath);
        }

        seenFieldNames.add(fieldPath);
    }

    if (unsupportedFieldNames.size > 0) {
        return `Unsupported registration field names: ${[...unsupportedFieldNames]
            .sort()
            .join(", ")}`;
    }

    if (duplicateFieldNames.size > 0) {
        return `Duplicate registration field names are not allowed: ${[
            ...duplicateFieldNames,
        ]
            .sort()
            .join(", ")}`;
    }

    return null;
}

function trimString(value: unknown): string | null {
    return typeof value === "string" ? value.trim() : null;
}

function asStringArray(value: unknown): string[] | null {
    if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
        return null;
    }

    return value.map((item) => item.trim());
}

function isFinancialStatementSectionKey(
    value: string,
): value is FinancialStatementSectionKey {
    return [
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
    ].includes(value);
}

function expectedPayloadType(simulatorType: SimulatorType | null): SyncAnswersPayload["type"] | null {
    switch (simulatorType) {
        case "classification":
            return "classification";
        case "journal_entry":
            return "journal_entry";
        case "ledger":
            return "ledger";
        case "trial_balance":
            return "trial_balance";
        case "financial_statement":
            return "financial_statement";
        case "itr_registration":
        case "epan_registration":
            return "registration";
        case "none":
        case null:
        default:
            return null;
    }
}

function parsePayload(body: unknown): SyncAnswersPayload | { error: string } {
    if (!body || typeof body !== "object") {
        return { error: "Request body must be a JSON object" };
    }

    const raw = body as Record<string, unknown>;

    switch (raw.type) {
        case "classification": {
            const options = asStringArray(raw.options);
            if (options === null) {
                return { error: "classification options must be an array of strings" };
            }

            if (!Array.isArray(raw.rows)) {
                return { error: "classification rows must be an array" };
            }

            const rows = raw.rows.map((row) => {
                if (!row || typeof row !== "object") {
                    return null;
                }

                const next = row as Record<string, unknown>;
                const label = trimString(next.label);
                const expected = trimString(next.expected);

                if (label === null || expected === null) {
                    return null;
                }

                return { label, expected };
            });

            if (rows.some((row) => row === null)) {
                return {
                    error: "classification rows must contain string label and expected values",
                };
            }

            const parsedRows = rows as ClassificationPayload["rows"];

            return {
                type: "classification",
                options,
                rows: parsedRows,
            };
        }
        case "grid": {
            const accountOptions = asStringArray(raw.accountOptions);
            if (accountOptions === null) {
                return { error: "grid accountOptions must be an array of strings" };
            }

            if (!Array.isArray(raw.rows)) {
                return { error: "grid rows must be an array" };
            }

            const rows = raw.rows.map((row) => {
                if (!row || typeof row !== "object") {
                    return null;
                }

                const next = row as Record<string, unknown>;
                const transactionDesc = trimString(next.transactionDesc);
                const drAccount = trimString(next.drAccount);
                const drAmount = trimString(next.drAmount);
                const crAccount = trimString(next.crAccount);
                const crAmount = trimString(next.crAmount);

                if (
                    transactionDesc === null ||
                    drAccount === null ||
                    drAmount === null ||
                    crAccount === null ||
                    crAmount === null
                ) {
                    return null;
                }

                return {
                    transactionDesc,
                    drAccount,
                    drAmount,
                    crAccount,
                    crAmount,
                };
            });

            if (rows.some((row) => row === null)) {
                return {
                    error: "grid rows must contain string transactionDesc, drAccount, drAmount, crAccount, and crAmount values",
                };
            }

            const parsedRows = rows as GridPayload["rows"];

            return {
                type: "grid",
                accountOptions,
                rows: parsedRows,
            };
        }
        case "journal_entry": {
            const accountOptions = asStringArray(raw.accountOptions);
            if (accountOptions === null) {
                return { error: "journal_entry accountOptions must be an array of strings" };
            }

            if (!Array.isArray(raw.rows)) {
                return { error: "journal_entry rows must be an array" };
            }

            const rows = raw.rows.map((row) => {
                if (!row || typeof row !== "object") {
                    return null;
                }

                const next = row as Record<string, unknown>;
                const transactionDesc = trimString(next.transactionDesc);
                if (transactionDesc === null || !Array.isArray(next.lines)) {
                    return null;
                }

                const lines = next.lines.map((line) => {
                    if (!line || typeof line !== "object") {
                        return null;
                    }

                    const lineRecord = line as Record<string, unknown>;
                    const side = lineRecord.side;
                    const account = trimString(lineRecord.account);
                    const amount = trimString(lineRecord.amount);

                    if (
                        account === null ||
                        amount === null ||
                        (side !== "debit" && side !== "credit")
                    ) {
                        return null;
                    }

                    return {
                        side,
                        account,
                        amount,
                    };
                });

                if (lines.some((line) => line === null)) {
                    return null;
                }

                return {
                    transactionDesc,
                    lines: lines as JournalEntryPayload["rows"][number]["lines"],
                };
            });

            if (rows.some((row) => row === null)) {
                return {
                    error: "journal_entry rows must contain string transactionDesc and valid line items",
                };
            }

            return {
                type: "journal_entry",
                accountOptions,
                rows: rows as JournalEntryPayload["rows"],
            };
        }
        case "ledger": {
            const accountOptions = asStringArray(raw.accountOptions);
            if (accountOptions === null) {
                return { error: "ledger accountOptions must be an array of strings" };
            }

            const parseSideRows = (value: unknown) => {
                if (!Array.isArray(value)) {
                    return null;
                }

                const rows = value.map((row) => {
                    if (!row || typeof row !== "object") {
                        return null;
                    }

                    const next = row as Record<string, unknown>;
                    const account = trimString(next.account);
                    const amount = trimString(next.amount);
                    if (account === null || amount === null) {
                        return null;
                    }

                    return { account, amount };
                });

                if (rows.some((row) => row === null)) {
                    return null;
                }

                return rows as LedgerPayload["debitRows"];
            };

            if (Array.isArray(raw.rows)) {
                const rows = raw.rows.map((row) => {
                    if (!row || typeof row !== "object") {
                        return null;
                    }

                    const next = row as Record<string, unknown>;
                    const transactionDesc = trimString(next.transactionDesc);
                    const debitRows = parseSideRows(next.debitRows);
                    const creditRows = parseSideRows(next.creditRows);

                    if (
                        transactionDesc === null ||
                        debitRows === null ||
                        creditRows === null
                    ) {
                        return null;
                    }

                    return {
                        transactionDesc,
                        debitRows,
                        creditRows,
                    };
                });

                if (rows.some((row) => row === null)) {
                    return {
                        error: "ledger rows must contain string transactionDesc and valid debitRows/creditRows values",
                    };
                }

                const parsedRows = rows as LedgerPayload["rows"];

                return {
                    type: "ledger",
                    accountOptions,
                    rows: parsedRows,
                    debitRows: parsedRows.flatMap((row) => row.debitRows),
                    creditRows: parsedRows.flatMap((row) => row.creditRows),
                };
            }

            const debitRows = parseSideRows(raw.debitRows);
            const creditRows = parseSideRows(raw.creditRows);
            if (debitRows === null || creditRows === null) {
                return {
                    error: "ledger requires rows or debitRows/creditRows with string account and amount values",
                };
            }

            const parsedDebitRows = debitRows ?? [];
            const parsedCreditRows = creditRows ?? [];

            return {
                type: "ledger",
                accountOptions,
                rows: Array.from(
                    { length: Math.max(parsedDebitRows.length, parsedCreditRows.length) },
                    (_, index) => ({
                        transactionDesc: "",
                        debitRows: parsedDebitRows[index] ? [parsedDebitRows[index]] : [],
                        creditRows: parsedCreditRows[index] ? [parsedCreditRows[index]] : [],
                    }),
                ),
                debitRows: parsedDebitRows,
                creditRows: parsedCreditRows,
            };
        }
        case "trial_balance": {
            const accountOptions = asStringArray(raw.accountOptions);
            if (accountOptions === null) {
                return { error: "trial_balance accountOptions must be an array of strings" };
            }

            if (!Array.isArray(raw.rows)) {
                return { error: "trial_balance rows must be an array" };
            }

            const rows = raw.rows.map((row) => {
                if (!row || typeof row !== "object") {
                    return null;
                }

                const next = row as Record<string, unknown>;
                const account = trimString(next.account);
                const side = next.side;
                const amount = trimString(next.amount);

                if (
                    account === null ||
                    amount === null ||
                    (side !== "debit" && side !== "credit")
                ) {
                    return null;
                }

                return {
                    account,
                    side,
                    amount,
                };
            });

            if (rows.some((row) => row === null)) {
                return {
                    error: "trial_balance rows must contain string account, valid side, and string amount values",
                };
            }

            const parsedRows = rows as TrialBalancePayload["rows"];

            return {
                type: "trial_balance",
                accountOptions,
                rows: parsedRows,
            };
        }
        case "financial_statement": {
            if (!Array.isArray(raw.sections)) {
                return { error: "financial_statement sections must be an array" };
            }

            const sections = raw.sections.map((section) => {
                if (!section || typeof section !== "object") {
                    return null;
                }

                const next = section as Record<string, unknown>;
                const sectionKey = trimString(next.sectionKey);
                const options = asStringArray(next.options);

                if (!sectionKey || !isFinancialStatementSectionKey(sectionKey)) {
                    return null;
                }

                if (options === null || !Array.isArray(next.rows)) {
                    return null;
                }

                const rows = next.rows.map((row) => {
                    if (!row || typeof row !== "object") {
                        return null;
                    }

                    const rowRecord = row as Record<string, unknown>;
                    const account = trimString(rowRecord.account);
                    const amount = trimString(rowRecord.amount);

                    if (account === null || amount === null) {
                        return null;
                    }

                    return { account, amount };
                });

                if (rows.some((row) => row === null)) {
                    return null;
                }

                return {
                    sectionKey,
                    options,
                    rows,
                };
            });

            if (sections.some((section) => section === null)) {
                return {
                    error: "financial_statement sections must contain valid sectionKey, options, and row values",
                };
            }

            const parsedSections =
                sections as FinancialStatementPayload["sections"];

            return {
                type: "financial_statement",
                sections: parsedSections,
            };
        }
        case "registration": {
            if (!Array.isArray(raw.fields)) {
                return { error: "registration fields must be an array" };
            }

            const fields = raw.fields.map((field) => {
                if (!field || typeof field !== "object") {
                    return null;
                }

                const next = field as Record<string, unknown>;
                const fieldPath = trimString(next.fieldPath);
                const expectedValue = trimString(next.expectedValue);

                if (fieldPath === null || expectedValue === null) {
                    return null;
                }

                return {
                    fieldPath,
                    expectedValue,
                };
            });

            if (fields.some((field) => field === null)) {
                return {
                    error: "registration fields must contain string fieldPath and expectedValue values",
                };
            }

            const parsedFields = fields as RegistrationPayload["fields"];

            return {
                type: "registration",
                fields: parsedFields,
            };
        }
        default:
            return { error: "Unsupported payload type" };
    }
}

async function loadQuestionAndSubmodule(
    questionId: string,
    adminDb: ReturnType<typeof createAdminClient>,
): Promise<
    | { question: QuestionRecord; submodule: SubmoduleRecord }
    | { errorResponse: NextResponse }
> {
    const { data: question, error: questionError } = await adminDb
        .from("questions")
        .select("id, submodule_id, title, type")
        .eq("id", questionId)
        .maybeSingle<QuestionRecord>();

    if (questionError) {
        throw questionError;
    }

    if (!question) {
        return { errorResponse: notFound("Question not found") };
    }

    if (question.type !== "question") {
        return { errorResponse: badRequest("Only question tasks can sync answers") };
    }

    const { data: submodule, error: submoduleError } = await adminDb
        .from("submodules")
        .select("id, is_active, simulator_type")
        .eq("id", question.submodule_id)
        .maybeSingle<SubmoduleRecord>();

    if (submoduleError) {
        throw submoduleError;
    }

    if (!submodule || !submodule.is_active) {
        return { errorResponse: notFound("Question not found") };
    }

    return { question, submodule };
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const { errorResponse } = await requireAdmin();
        if (errorResponse) {
            return errorResponse;
        }
        const adminDb = createAdminClient();

        const loaded = await loadQuestionAndSubmodule(id, adminDb);
        if ("errorResponse" in loaded) {
            return loaded.errorResponse;
        }

        const expectedType = expectedPayloadType(loaded.submodule.simulator_type);
        if (!expectedType) {
            return badRequest("simulator_type is none or unsupported for sync-answers");
        }

        const parsedPayload = parsePayload(await request.json());
        if ("error" in parsedPayload) {
            return badRequest(parsedPayload.error);
        }

        if (parsedPayload.type !== expectedType) {
            return badRequest(
                `Payload type "${parsedPayload.type}" does not match simulator_type "${loaded.submodule.simulator_type}"`,
            );
        }

        const registrationFieldDefinitions =
            parsedPayload.type === "registration"
                ? await loadRegistrationFieldDefinitions(
                      adminDb,
                      loaded.submodule.simulator_type,
                  )
                : null;

        if (
            parsedPayload.type === "registration" &&
            registrationFieldDefinitions !== null
        ) {
            const validationError = validateRegistrationPayload(
                parsedPayload,
                registrationFieldDefinitions,
            );

            if (validationError) {
                return badRequest(validationError);
            }
        }

        const { data: existingTask, error: taskLookupError } = await adminDb
            .from("simulation_tasks")
            .select("id")
            .eq("question_id", id)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle<{ id: string }>();

        if (taskLookupError) {
            throw taskLookupError;
        }

        const taskId = existingTask?.id
            ? existingTask.id
            : await (async () => {
                  const { data, error } = await adminDb
                      .from("simulation_tasks")
                      .insert({
                          question_id: id,
                          title: loaded.question.title,
                          description: `Simulation specific to ${loaded.question.title}`,
                          max_score: 0,
                          show_expected_answers_in_evaluation: false,
                      })
                      .select("id")
                      .single<{ id: string }>();

                  if (error) {
                      throw error;
                  }

                  return data?.id;
              })();

        if (!taskId) {
            throw new Error("Failed to create simulation task");
        }

        const { data: existingSteps, error: stepLookupError } = await adminDb
            .from("simulation_steps")
            .select("id, step_order")
            .eq("task_id", taskId)
            .order("step_order", { ascending: true });

        if (stepLookupError) {
            throw stepLookupError;
        }

        const primaryStepId = existingSteps?.[0]?.id
            ? existingSteps[0].id
            : await (async () => {
                  const { data, error } = await adminDb
                      .from("simulation_steps")
                      .insert({
                          task_id: taskId,
                          step_order: 1,
                          title: loaded.question.title,
                      })
                      .select("id")
                      .single<{ id: string }>();

                  if (error) {
                      throw error;
                  }

                  return data?.id;
              })();

        if (!primaryStepId) {
            throw new Error("Failed to create simulation step");
        }

        const allStepIds = [
            primaryStepId,
            ...((existingSteps ?? []).map((step) => step.id).filter((id) => id !== primaryStepId)),
        ];

        const submoduleSimulatorType = loaded.submodule.simulator_type;
        const fields = generateFields(primaryStepId, parsedPayload, {
            registrationFieldDefinitions,
            simulatorType: isRegistrationSimulatorType(submoduleSimulatorType)
                ? submoduleSimulatorType
                : null,
        });
        const { data: existingFields, error: existingFieldsError } = await adminDb
            .from("simulation_fields")
            .select(
                "id, step_id, field_name, field_type, field_label, expected_value, options, order_index",
            )
            .in("step_id", allStepIds)
            .order("step_id", { ascending: true })
            .order("order_index", { ascending: true });

        if (existingFieldsError) {
            throw existingFieldsError;
        }

        let fieldsDeleted = false;

        try {
            const { error: deleteError } = await adminDb
                .from("simulation_fields")
                .delete()
                .in("step_id", allStepIds);

            if (deleteError) {
                throw deleteError;
            }

            fieldsDeleted = true;

            if (fields.length > 0) {
                const { error: insertError } = await adminDb
                    .from("simulation_fields")
                    .insert(fields);

                if (insertError) {
                    throw insertError;
                }
            }

            if (
                parsedPayload.type === "classification" ||
                parsedPayload.type === "journal_entry" ||
                parsedPayload.type === "ledger"
            ) {
                const evidenceTable = buildEvidenceTable(parsedPayload);
                const questionUpdate: {
                    has_table: boolean;
                    table_data: ReturnType<typeof buildEvidenceTable>;
                } = {
                    has_table: evidenceTable !== null,
                    table_data: evidenceTable,
                };

                const { error: questionUpdateError } = await adminDb
                    .from("questions")
                    .update(questionUpdate)
                    .eq("id", id);

                if (questionUpdateError) {
                    throw questionUpdateError;
                }
            }
        } catch (error) {
            if (fieldsDeleted && (existingFields?.length ?? 0) > 0) {
                const restorePayload = (existingFields as ExistingSimulationFieldRecord[]).map(
                    (field) => ({
                        step_id: field.step_id,
                        field_name: field.field_name,
                        field_type: field.field_type,
                        field_label: field.field_label,
                        expected_value: field.expected_value,
                        options: field.options,
                        order_index: field.order_index,
                    }),
                );

                const { error: restoreError } = await adminDb
                    .from("simulation_fields")
                    .insert(restorePayload);

                if (restoreError) {
                    console.error(
                        "Failed to restore simulation fields after sync error:",
                        restoreError,
                    );
                }
            }

            throw error;
        }

        revalidateQuestionsTag();

        return NextResponse.json({
            success: true,
            fieldCount: fields.length,
            taskId,
            stepId: primaryStepId,
        });
    } catch (error: unknown) {
        return internalServerError("Error syncing question answers:", error);
    }
}
