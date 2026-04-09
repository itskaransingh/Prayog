"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";

import { PrayogLogo } from "@/components/branding/prayog-logo";
import { DraggableCalculator } from "@/components/simulation/shared/draggable-calculator";
import { EvaluationPopup } from "@/components/simulation/income-tax/shared/evaluation-results";
import { createClient } from "@/lib/supabase/client";
import { evaluateRegistration, type EvaluationResult } from "@/lib/evaluation";
import {
    saveSimulationAttempt,
    type PersistableEvaluationMapping,
    type SimulationAttemptAnswerInput,
} from "@/lib/simulation/attempts";
import type { QuestionTableData } from "@/lib/supabase/questions";

// --- Interfaces ---
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

// --- Helper Functions ---
function parseOptions(options: unknown): string[] {
    if (Array.isArray(options)) return options.filter((v): v is string => typeof v === "string");
    if (typeof options === "string") {
        try {
            const parsed = JSON.parse(options) as unknown;
            return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
        } catch { return []; }
    }
    return [];
}

function extractContentCells(row: string[]): string[] {
    if (row.length === 0) return [];
    const looksLikeSerial = row[0] && !Number.isNaN(Number(row[0].trim()));
    return looksLikeSerial ? row.slice(1) : row;
}

function getQuestionBadge(questionId: string | null): string {
    if (!questionId) return "Question";
    return `Question No: ${questionId.slice(0, 8).toUpperCase()}`;
}

function getAnswerColumnLabel(questionTitle: string): string {
    if (/ledger\s*classification|classification/i.test(questionTitle)) {
        return "Account Type";
    }
    if (/ledger\s*posting|posting/i.test(questionTitle)) {
        return "Debit/Credit";
    }
    if (/ledger\s*recognition|recognition/i.test(questionTitle)) {
        return "Account";
    }
    return "Nature";
}

function isLedgerPostingQuestion(questionTitle: string): boolean {
    return /ledger\s*posting|posting/i.test(questionTitle);
}

function getDisplayHeaders(questionTitle: string, headers: string[]): string[] {
    if (!isLedgerPostingQuestion(questionTitle)) {
        return headers;
    }

    const transactionIndex = headers.findIndex((header) => /context|transaction/i.test(header));
    const orderedIndexes = transactionIndex >= 0
        ? [transactionIndex, ...headers.map((_, index) => index).filter((index) => index !== transactionIndex)]
        : headers.map((_, index) => index);

    return orderedIndexes.map((index) =>
        /context|transaction/i.test(headers[index] ?? "") ? "Transaction" : headers[index] ?? "",
    );
}

function getDisplayCells(
    questionTitle: string,
    headers: string[],
    contentCells: string[],
): string[] {
    if (!isLedgerPostingQuestion(questionTitle)) {
        return contentCells;
    }

    const transactionIndex = headers.findIndex((header) => /context|transaction/i.test(header));
    if (transactionIndex < 0) {
        return contentCells;
    }

    return [
        contentCells[transactionIndex] ?? "",
        ...contentCells.filter((_, index) => index !== transactionIndex),
    ];
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
    const [questionTitle, setQuestionTitle] = useState<string>("Revenue or Capital Identification");
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
    const [evaluationResults, setEvaluationResults] = useState<EvaluationResult | null>(null);
    const [showEvaluation, setShowEvaluation] = useState(false);

    useEffect(() => { setStartedAt(Date.now()); }, [questionId]);

    useEffect(() => {
        async function loadSimulation() {
            if (!questionId) { setError("No question specified."); setLoading(false); return; }
            setLoading(true); setError(null);
            try {
                const { data: taskRecord } = await supabase.from("simulation_tasks").select("id").eq("question_id", questionId).limit(1).maybeSingle();
                if (!taskRecord) throw new Error("No simulation task found.");
                const { data: stepRecord } = await supabase.from("simulation_steps").select("id").eq("task_id", taskRecord.id).order("step_order", { ascending: true }).limit(1).maybeSingle();
                if (!stepRecord) throw new Error("No simulation step found.");
                const { data: fields } = await supabase.from("simulation_fields").select("id, field_name, field_label, options, order_index, expected_value").eq("step_id", stepRecord.id).order("order_index", { ascending: true });
                const { data: questionRecord } = await supabase.from("questions").select("table_data").eq("id", questionId).limit(1).maybeSingle();
                setTask({ taskId: taskRecord.id, tableData: (questionRecord?.table_data as QuestionTableData | null) ?? null, fields: (fields as SimulationFieldRecord[] | null) ?? [], });
                try {
                    const { data: titleRecord } = await supabase.from("questions").select("title").eq("id", questionId).limit(1).maybeSingle();
                    if (titleRecord?.title) setQuestionTitle(titleRecord.title);
                } catch { /* title column may not exist */ }
            } catch (err) { setError(err instanceof Error ? err.message : "Load failed"); } finally { setLoading(false); }
        }
        loadSimulation();
    }, [questionId, supabase]);

    const baseHeaders = useMemo(() => {
        const headers = task?.tableData?.headers ?? [];
        const normalizedHeaders =
            headers.length > 0
                ? headers[0] && /^(sl|sr|#)/i.test(headers[0])
                    ? headers.slice(1)
                    : headers
                : isLedgerPostingQuestion(questionTitle)
                  ? ["Transaction"]
                  : ["Transactions"];

        return getDisplayHeaders(questionTitle, normalizedHeaders);
    }, [questionTitle, task?.tableData]);

    const renderedRows = useMemo(() => (task?.tableData?.rows ?? []).map((row, index) => {
        const field = (task?.fields ?? []).find(f => f.order_index === index + 1) || null;
        const rawContentCells = extractContentCells(row);
        const sourceHeaders = (task?.tableData?.headers ?? []).length > 0
            ? ((task?.tableData?.headers ?? [])[0] && /^(sl|sr|#)/i.test((task?.tableData?.headers ?? [])[0] ?? "")
                ? (task?.tableData?.headers ?? []).slice(1)
                : (task?.tableData?.headers ?? []))
            : [];

        return {
            rowIndex: index,
            field,
            contentCells: getDisplayCells(questionTitle, sourceHeaders, rawContentCells),
            accountName: field?.field_label?.trim() || "Untitled field",
            options: parseOptions(field?.options),
        };
    }), [questionTitle, task]);
    const answerColumnLabel = useMemo(() => getAnswerColumnLabel(questionTitle), [questionTitle]);

    async function handleLogout() { await supabase.auth.signOut(); window.location.href = "/login"; }

    async function handleSubmit() {
        if (!questionId || !task) return;
        setSubmitting(true);
        setError(null);
        setSaveMessage(null);
        try {
            const endTime = Date.now();

            // FIX: Renamed 'fieldId' to 'fieldPath' to prevent the .split() error in evaluation.ts
            const mappings: PersistableEvaluationMapping[] = renderedRows
                .filter(r => r.field)
                .map(r => ({
                    fieldPath: r.field!.id,
                    expectedValue: r.field!.expected_value ?? "",
                    label: r.accountName,
                    weight: 1,
                }));

            const results = evaluateRegistration(selectedAnswers, startedAt, endTime, mappings);
            setEvaluationResults(results);
            setShowEvaluation(true);

            await saveSimulationAttempt({
                questionId,
                taskId: task.taskId,
                startTime: startedAt,
                endTime,
                answers: renderedRows
                    .filter(r => r.field)
                    .map(r => ({
                        field_id: r.field!.id,
                        entered_value: selectedAnswers[r.field!.id] ?? "",
                    } as SimulationAttemptAnswerInput)),
            });
            setSaveMessage("Attempt saved successfully.");
        } catch (err) {
            console.error("Submission error:", err);
            setError(err instanceof Error ? err.message : "Submission failed.");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return (
        <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#f4f6f8", color: "#94a3b8", fontFamily: "sans-serif" }}>
            Loading...
        </div>
    );

    return (
        <>
            <style>{`
                html, body { margin: 0; padding: 0; }
                .rci-page { min-height: 100vh; background: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
                .rci-header { position: sticky; top: 0; z-index: 50; width: 100%; background: #ffffff; border-bottom: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
                .rci-header-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; min-height: 76px; display: flex; align-items: center; justify-content: space-between; }
                .rci-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
                .rci-header-badge { border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 4px 14px; font-size: 13px; font-weight: 600; color: #334155; background: #fff; }
                .rci-header-right { display: flex; align-items: center; gap: 16px; }
                .rci-question-badge { border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 4px 14px; font-size: 13px; font-weight: 600; color: #334155; background: #fff; }
                .rci-logout-btn { display: flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; font-size: 13px; font-weight: 600; color: #64748b; padding: 4px 8px; border-radius: 6px; transition: color 0.15s; }
                .rci-logout-btn:hover { color: #ef4444; }
                .rci-main { max-width: 1100px; margin: 0 auto; padding: 48px 24px 120px; }
                .rci-title { text-align: center; font-size: 26px; font-weight: 700; color: #1e293b; margin: 0 0 32px; letter-spacing: -0.3px; }
                .rci-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04); }
                .rci-table { width: 100%; border-collapse: collapse; }
                .rci-table thead tr { background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; }
                .rci-th { padding: 14px 24px; text-align: left; font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; }
                .rci-th-num { width: 72px; }
                .rci-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.1s; }
                .rci-table tbody tr:last-child { border-bottom: none; }
                .rci-table tbody tr:hover { background: #f8fafc; }
                .rci-td { padding: 18px 24px; vertical-align: middle; }
                .rci-td-num { font-size: 14px; font-weight: 500; color: #94a3b8; padding: 18px 24px; vertical-align: middle; }
                .rci-td-text { font-size: 15px; color: #334155; line-height: 1.5; padding: 18px 24px; vertical-align: middle; }
                .rci-select-wrap { position: relative; }
                .rci-select { width: 100%; height: 40px; padding: 0 40px 0 14px; appearance: none; -webkit-appearance: none; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; color: #334155; cursor: pointer; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
                .rci-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
                .rci-select-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: #94a3b8; pointer-events: none; }
                .rci-feedback { margin-top: 20px; border-radius: 8px; padding: 12px 20px; font-size: 14px; font-weight: 600; text-align: center; }
                .rci-feedback-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
                .rci-feedback-success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; }
                .rci-footer { position: fixed; bottom: 0; left: 0; width: 100%; background: rgba(255,255,255,0.92); backdrop-filter: blur(10px); border-top: 1px solid #e2e8f0; padding: 16px 0; z-index: 40; }
                .rci-footer-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; display: flex; justify-content: flex-end; }
                .rci-validate-btn { height: 44px; min-width: 160px; padding: 0 32px; background: #0f2d52; color: #ffffff; font-size: 14px; font-weight: 700; border: none; border-radius: 8px; cursor: pointer; transition: background 0.15s, transform 0.1s; letter-spacing: 0.02em; }
                .rci-validate-btn:hover { background: #1e3a6e; }
                .rci-validate-btn:active { transform: scale(0.97); }
                .rci-validate-btn:disabled { opacity: 0.55; cursor: not-allowed; }
            `}</style>

            <div className="rci-page">
                <header className="rci-header">
                    <div className="rci-header-inner">
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                            <Link href="/" className="rci-logo">
                                <PrayogLogo className="h-16 w-[264px]" priority />
                            </Link>
                            <div className="rci-header-badge">{questionTitle}</div>
                        </div>
                        <div className="rci-header-right">
                            <div className="rci-question-badge">{getQuestionBadge(questionId)}</div>
                            <button onClick={handleLogout} className="rci-logout-btn">
                                <LogOut size={14} />
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                <main className="rci-main">
                    <h1 className="rci-title">{questionTitle}</h1>
                    <div className="rci-card">
                        <table className="rci-table">
                            <thead>
                                <tr>
                                    <th className="rci-th rci-th-num">#</th>
                                    {baseHeaders.map((header, index) => (
                                        <th key={`${header}-${index}`} className="rci-th">
                                            {header}
                                        </th>
                                    ))}
                                    <th className="rci-th">{answerColumnLabel}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderedRows.map((row) => (
                                    <tr key={row.field?.id || row.rowIndex}>
                                        <td className="rci-td-num">{row.rowIndex + 1}</td>
                                        {baseHeaders.map((_, cellIndex) => (
                                            <td
                                                key={`${row.field?.id || row.rowIndex}-cell-${cellIndex}`}
                                                className="rci-td-text"
                                            >
                                                {row.contentCells[cellIndex] ?? ""}
                                            </td>
                                        ))}
                                        <td className="rci-td">
                                            {row.field && (
                                                <div className="rci-select-wrap">
                                                    <select
                                                        className="rci-select"
                                                        value={selectedAnswers[row.field.id] || ""}
                                                        onChange={(e) => setSelectedAnswers(prev => ({ ...prev, [row.field!.id]: e.target.value }))}
                                                    >
                                                        <option value="">Choose</option>
                                                        {row.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                    <ChevronDown className="rci-select-icon" />
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {(error || saveMessage) && (
                        <div className={`rci-feedback ${error ? "rci-feedback-error" : "rci-feedback-success"}`}>
                            {error || saveMessage}
                        </div>
                    )}
                </main>

                <div className="rci-footer">
                    <div className="rci-footer-inner">
                        <button className="rci-validate-btn" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? "Processing..." : "Validate"}
                        </button>
                    </div>
                </div>

                <EvaluationPopup
                    open={showEvaluation}
                    onClose={() => setShowEvaluation(false)}
                    results={evaluationResults}
                    showExpectedValues={false}
                />
                <DraggableCalculator />
            </div>
        </>
    );
}

export default function FinancialAccountingSimulationPage() {
    return (
        <Suspense fallback={
            <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#f0f2f5" }}>
                Loading...
            </div>
        }>
            <FinancialAccountingSimulationPageInner />
        </Suspense>
    );
}
