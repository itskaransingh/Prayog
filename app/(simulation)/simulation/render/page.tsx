"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LogOut } from "lucide-react";

import { EvaluationPopup } from "@/components/simulation/income-tax/shared/evaluation-results";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { evaluateRegistration, type EvaluationResult } from "@/lib/evaluation";
import {
    saveSimulationAttempt,
    type PersistableEvaluationMapping,
    type SimulationAttemptAnswerInput,
} from "@/lib/simulation/attempts";
import type { QuestionTableData } from "@/lib/supabase/questions";

interface SimulationFieldRecord {
    id: string;
    field_name: string | null;
    field_label: string | null;
    options: unknown;
    order_index: number | null;
    expected_value: string | null;
}

interface SimulationTaskPayload {
    taskId: string;
    tableData: QuestionTableData | null;
    fields: SimulationFieldRecord[];
}

function parseOptions(options: unknown): string[] {
    if (Array.isArray(options)) {
        return options.filter((value): value is string => typeof value === "string");
    }

    if (typeof options === "string") {
        try {
            const parsed = JSON.parse(options) as unknown;
            return Array.isArray(parsed)
                ? parsed.filter((value): value is string => typeof value === "string")
                : [];
        } catch {
            return [];
        }
    }

    return [];
}

function extractContentCells(row: string[]): string[] {
    if (row.length === 0) {
        return [];
    }

    const looksLikeSerial = row[0] && !Number.isNaN(Number(row[0].trim()));
    return looksLikeSerial ? row.slice(1) : row;
}

function getQuestionBadge(questionId: string | null): string {
    if (!questionId) {
        return "Question";
    }

    return `Question No: ${questionId.slice(0, 8).toUpperCase()}`;
}

function normalizeLabel(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function FinancialAccountingSimulationPageInner() {
    const searchParams = useSearchParams();
    const questionId = searchParams.get("questionId");
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [startedAt, setStartedAt] = useState<number>(() => Date.now());
    const [task, setTask] = useState<SimulationTaskPayload | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    const [evaluationResults, setEvaluationResults] = useState<EvaluationResult | null>(null);
    const [showEvaluation, setShowEvaluation] = useState(false);

    useEffect(() => {
        setStartedAt(Date.now());
    }, [questionId]);

    useEffect(() => {
        async function loadSimulation() {
            if (!questionId) {
                setError("No question specified.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const { data: taskRecord, error: taskError } = await supabase
                    .from("simulation_tasks")
                    .select("id")
                    .eq("question_id", questionId)
                    .limit(1)
                    .maybeSingle();

                if (taskError) {
                    throw taskError;
                }

                if (!taskRecord) {
                    throw new Error("No simulation task found for this question.");
                }

                const { data: stepRecord, error: stepError } = await supabase
                    .from("simulation_steps")
                    .select("id")
                    .eq("task_id", taskRecord.id)
                    .order("step_order", { ascending: true })
                    .limit(1)
                    .maybeSingle();

                if (stepError) {
                    throw stepError;
                }

                if (!stepRecord) {
                    throw new Error("No simulation step found for this task.");
                }

                const { data: fields, error: fieldsError } = await supabase
                    .from("simulation_fields")
                    .select("id, field_name, field_label, options, order_index, expected_value")
                    .eq("step_id", stepRecord.id)
                    .order("order_index", { ascending: true });

                if (fieldsError) {
                    throw fieldsError;
                }

                const { data: questionRecord, error: questionError } = await supabase
                    .from("questions")
                    .select("table_data")
                    .eq("id", questionId)
                    .limit(1)
                    .maybeSingle();

                if (questionError) {
                    throw questionError;
                }

                setTask({
                    taskId: taskRecord.id,
                    tableData: (questionRecord?.table_data as QuestionTableData | null) ?? null,
                    fields: (fields as SimulationFieldRecord[] | null) ?? [],
                });
                setSelectedAnswers({});
                setSaveMessage(null);
            } catch (loadError) {
                const message = loadError instanceof Error ? loadError.message : "Failed to load simulation.";
                console.error("Financial accounting simulation load failed", loadError);
                setError(message);
                setTask(null);
            } finally {
                setLoading(false);
            }
        }

        loadSimulation();
    }, [questionId, supabase]);

    const fieldsByRowIndex = useMemo(() => {
        const mapping = new Map<number, SimulationFieldRecord>();

        for (const field of task?.fields ?? []) {
            if (typeof field.order_index === "number") {
                mapping.set(field.order_index - 1, field);
            }
        }

        return mapping;
    }, [task?.fields]);

    const baseHeaders = useMemo(() => {
        const headers = task?.tableData?.headers ?? [];
        if (headers.length > 0) {
            const withoutSerial = headers[0] && /^(sl|sr|#)/i.test(headers[0]) ? headers.slice(1) : headers;
            return withoutSerial;
        }

        const firstRow = task?.tableData?.rows?.[0] ?? [];
        return extractContentCells(firstRow).map((_, index) => (index === 0 ? "Transactions" : `Detail ${index + 1}`));
    }, [task?.tableData]);

    const renderedRows = useMemo(
        () =>
            (task?.tableData?.rows ?? []).map((row, index) => {
                const field = fieldsByRowIndex.get(index) ?? null;
                const contentCells = extractContentCells(row);

                return {
                    rowIndex: index,
                    field,
                    contentCells,
                    accountName: field?.field_label?.trim() || "Untitled field",
                    options: parseOptions(field?.options),
                };
            }),
        [fieldsByRowIndex, task?.tableData?.rows],
    );

    const showDerivedAccountColumn = useMemo(() => {
        if (baseHeaders.length === 0 || renderedRows.length === 0) {
            return true;
        }

        const accountHeaderIndex = baseHeaders.findIndex((header) =>
            ["account", "account name", "accounts", "ledger", "ledger name"].includes(normalizeLabel(header)),
        );

        if (accountHeaderIndex === -1) {
            return true;
        }

        return !renderedRows.every((row) => {
            const existingValue = row.contentCells[accountHeaderIndex]?.trim().toLowerCase();
            const derivedValue = row.accountName.trim().toLowerCase();
            return existingValue && derivedValue && existingValue === derivedValue;
        });
    }, [baseHeaders, renderedRows]);

    const evaluationMappings = useMemo<PersistableEvaluationMapping[]>(
        () =>
            renderedRows
                .filter((entry): entry is typeof entry & { field: SimulationFieldRecord } => entry.field !== null)
                .map((entry) => ({
                    fieldId: entry.field.id,
                    fieldName: entry.field.field_name || undefined,
                    fieldPath: entry.field.id,
                    expectedValue: entry.field.expected_value ?? "",
                    label: entry.field.field_label?.trim() || entry.accountName,
                    weight: 1,
                })),
        [renderedRows],
    );

    async function handleLogout() {
        await supabase.auth.signOut();
        window.location.href = "/login";
    }

    async function handleSubmit() {
        if (!questionId || !task) {
            return;
        }

        setSubmitting(true);
        setError(null);
        setSaveMessage(null);

        try {
            const endTime = Date.now();
            const localResults = evaluateRegistration(
                selectedAnswers,
                startedAt,
                endTime,
                evaluationMappings,
            );

            const answers: SimulationAttemptAnswerInput[] = renderedRows
                .filter((entry): entry is typeof entry & { field: SimulationFieldRecord } => entry.field !== null)
                .map((entry) => ({
                    field_id: entry.field.id,
                    field_name: entry.field.field_name || undefined,
                    entered_value: selectedAnswers[entry.field.id] ?? "",
                }));

            setEvaluationResults(localResults);
            setShowEvaluation(true);

            await saveSimulationAttempt({
                questionId,
                taskId: task.taskId,
                startTime: startedAt,
                endTime,
                answers,
            });

            setSaveMessage("Attempt saved successfully.");
        } catch (submitError) {
            const message = submitError instanceof Error ? submitError.message : "Failed to submit attempt.";
            console.error("Financial accounting simulation submission failed", submitError);
            setError(message);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-6">
                <p className="text-sm text-muted-foreground">Loading simulation...</p>
            </div>
        );
    }

    if (error && !task) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-6">
                <Card className="w-full max-w-xl border-red-200 shadow-sm">
                    <CardContent className="pt-6 text-center">
                        <p className="text-sm text-red-700">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-[#f2f3f5] text-foreground">
                <div className="h-3 bg-[#2e3a2f]" />
                <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
                    <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-4 sm:px-6">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-sm font-bold text-white">
                                    P
                                </div>
                                <span className="text-base font-semibold tracking-tight text-slate-500">Prayog</span>
                            </Link>
                            <span className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-1.5 text-sm font-semibold text-slate-600">
                                Ledger Posting
                            </span>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4">
                            <span className="hidden rounded-xl border border-slate-300 bg-slate-50 px-4 py-1.5 text-sm font-semibold text-slate-600 sm:inline-flex">
                                {getQuestionBadge(questionId)}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="gap-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-[1180px] px-3 pb-28 pt-7 sm:px-6 sm:pt-8">
                    <div className="mb-7 border-b border-slate-200 pb-5 text-center">
                        <h1 className="text-4xl font-semibold tracking-tight text-[#0f172a] sm:text-5xl">
                            Ledger Posting
                        </h1>
                    </div>

                    <Card className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-none">
                        <CardContent className="p-0">
                            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-base font-semibold text-slate-900">Question Table</h2>
                                    </div>
                                    <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
                                        {renderedRows.length} rows
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[840px] border-separate border-spacing-0">
                                    <thead>
                                        <tr>
                                            <th className="border-b border-slate-200 bg-[#fafbfd] px-4 py-3 text-left text-sm font-semibold text-slate-900">
                                                #
                                            </th>
                                            {baseHeaders.map((header, index) => (
                                                <th
                                                    key={`${header}-${index}`}
                                                    className="border-b border-slate-200 bg-[#fafbfd] px-4 py-3 text-left text-sm font-semibold text-slate-900"
                                                >
                                                    {header}
                                                </th>
                                            ))}
                                            {showDerivedAccountColumn && (
                                                <th className="border-b border-slate-200 bg-[#fafbfd] px-4 py-3 text-left text-sm font-semibold text-slate-900">
                                                    Accounts
                                                </th>
                                            )}
                                            <th className="border-b border-slate-200 bg-[#fafbfd] px-4 py-3 text-left text-sm font-semibold text-slate-900">
                                                Debit/Credit
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {renderedRows.map((entry) => (
                                            <tr key={entry.field?.id ?? entry.rowIndex}>
                                                <td className="border-b border-slate-100 px-4 py-3 align-top text-sm font-medium text-slate-700">
                                                    {entry.rowIndex + 1}
                                                </td>
                                                {baseHeaders.map((_, index) => (
                                                    <td
                                                        key={`${entry.rowIndex}-${index}`}
                                                        className="border-b border-slate-100 px-4 py-3 align-top text-[15px] leading-7 text-slate-700"
                                                    >
                                                        {entry.contentCells[index] || "—"}
                                                    </td>
                                                ))}
                                                {showDerivedAccountColumn && (
                                                    <td className="border-b border-slate-100 px-4 py-3 align-top text-[15px] font-medium text-slate-900">
                                                        {entry.accountName}
                                                    </td>
                                                )}
                                                <td className="border-b border-slate-100 px-4 py-2.5 align-top">
                                                    {entry.field ? (
                                                        <select
                                                            value={selectedAnswers[entry.field.id] ?? ""}
                                                            onChange={(event) =>
                                                                setSelectedAnswers((current) => ({
                                                                    ...current,
                                                                    [entry.field!.id]: event.target.value,
                                                                }))
                                                            }
                                                            aria-label={entry.field.field_label || entry.accountName}
                                                            className="h-10 w-full min-w-[220px] rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                                                        >
                                                            <option value="">Choose</option>
                                                            {entry.options.map((option) => (
                                                                <option key={option} value={option}>
                                                                    {option}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span className="text-sm text-slate-500">No field mapping</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {(error || saveMessage) && (
                        <div className="mx-auto mt-5 max-w-4xl">
                            {error && (
                                <Card className="border-red-200 bg-red-50 shadow-none">
                                    <CardContent className="px-5 py-3 text-sm text-red-700">{error}</CardContent>
                                </Card>
                            )}
                            {!error && saveMessage && (
                                <Card className="border-emerald-200 bg-emerald-50 shadow-none">
                                    <CardContent className="px-5 py-3 text-sm text-emerald-700">{saveMessage}</CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                </main>

                <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-[#f7f7f8]">
                    <div className="mx-auto flex h-20 w-full max-w-[1180px] items-center justify-end px-6">
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="h-11 rounded-full bg-[#1b3769] px-12 text-base font-semibold text-white transition hover:bg-[#152d56]"
                        >
                            {submitting ? "Saving..." : "Validate"}
                        </Button>
                    </div>
                </div>
            </div>

            <EvaluationPopup
                open={showEvaluation}
                onClose={() => setShowEvaluation(false)}
                results={evaluationResults}
                showExpectedValues={false}
            />
        </>
    );
}

export default function FinancialAccountingSimulationPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading simulation...</div>}>
            <FinancialAccountingSimulationPageInner />
        </Suspense>
    );
}
