import { NextResponse } from "next/server";

import {
    badRequest,
    internalServerError,
    notFound,
    requireAdmin,
    revalidateQuestionsTag,
} from "@/app/api/admin/simulation-route-utils";
import {
    buildEvidenceTable,
    generateFields,
    type ClassificationPayload,
    type FinancialStatementPayload,
    type FinancialStatementSectionKey,
    type GridPayload,
    type RegistrationPayload,
    type SimulatorType,
    type SyncAnswersPayload,
    type TrialBalancePayload,
} from "@/lib/simulation/answer-field-generator";
import type { QuestionType } from "@/lib/questions/types";

interface QuestionRecord {
    id: string;
    submodule_id: string;
    type: QuestionType;
}

interface SubmoduleRecord {
    id: string;
    is_active: boolean;
    simulator_type: SimulatorType | null;
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
        case "ledger":
            return "grid";
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
    supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
): Promise<
    | { question: QuestionRecord; submodule: SubmoduleRecord }
    | { errorResponse: NextResponse }
> {
    const { data: question, error: questionError } = await supabase
        .from("questions")
        .select("id, submodule_id, type")
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

    const { data: submodule, error: submoduleError } = await supabase
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
        const { supabase, errorResponse } = await requireAdmin();
        if (errorResponse) {
            return errorResponse;
        }

        const loaded = await loadQuestionAndSubmodule(id, supabase);
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

        const { data: existingTask, error: taskLookupError } = await supabase
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
                  const { data, error } = await supabase
                      .from("simulation_tasks")
                      .insert({ question_id: id })
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

        const { data: existingStep, error: stepLookupError } = await supabase
            .from("simulation_steps")
            .select("id")
            .eq("task_id", taskId)
            .order("step_order", { ascending: true })
            .limit(1)
            .maybeSingle<{ id: string }>();

        if (stepLookupError) {
            throw stepLookupError;
        }

        const stepId = existingStep?.id
            ? existingStep.id
            : await (async () => {
                  const { data, error } = await supabase
                      .from("simulation_steps")
                      .insert({ task_id: taskId, step_order: 1 })
                      .select("id")
                      .single<{ id: string }>();

                  if (error) {
                      throw error;
                  }

                  return data?.id;
              })();

        if (!stepId) {
            throw new Error("Failed to create simulation step");
        }

        const { error: deleteError } = await supabase
            .from("simulation_fields")
            .delete()
            .eq("step_id", stepId);

        if (deleteError) {
            throw deleteError;
        }

        const fields = generateFields(stepId, parsedPayload);
        if (fields.length > 0) {
            const { error: insertError } = await supabase
                .from("simulation_fields")
                .insert(fields);

            if (insertError) {
                throw insertError;
            }
        }

        if (
            parsedPayload.type === "classification" ||
            parsedPayload.type === "grid"
        ) {
            const evidenceTable = buildEvidenceTable(parsedPayload);
            const questionUpdate: { table_data: ReturnType<typeof buildEvidenceTable> } =
                {
                    table_data: evidenceTable,
                };

            const { error: questionUpdateError } = await supabase
                .from("questions")
                .update(questionUpdate)
                .eq("id", id);

            if (questionUpdateError) {
                throw questionUpdateError;
            }
        }

        revalidateQuestionsTag();

        return NextResponse.json({
            success: true,
            fieldCount: fields.length,
            taskId,
            stepId,
        });
    } catch (error: unknown) {
        return internalServerError("Error syncing question answers:", error);
    }
}
