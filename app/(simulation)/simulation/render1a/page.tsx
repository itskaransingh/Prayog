"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { saveSimulationAttempt } from "@/lib/simulation/attempts";
import { PrayogLogo } from "@/components/branding/prayog-logo";
import { DraggableCalculator } from "@/components/simulation/shared/draggable-calculator";
import { EvaluationPopup } from "@/components/simulation/income-tax/shared/evaluation-results";
import {
    buildGridEvaluationResult,
    buildJournalAttemptAnswers,
    buildJournalBreakdownRows,
    normalizeGridFields,
    type JournalLineInput,
    type SimulationFieldRecord,
} from "@/lib/simulation/grid-field-mapper";
import Link from "next/link";
import { LogOut, Loader2, AlertCircle } from "lucide-react";

type SimulationFieldWithOptions = SimulationFieldRecord & { options?: string[] | null };

function createDefaultJournalLines(): JournalLineInput[] {
    return [
        { account: "", dr: "", cr: "" },
        { account: "", dr: "", cr: "" },
    ];
}

function getJournalEntryHeading(questionTitle: string): string {
    return /journal\s*entry/i.test(questionTitle) ? "Journal Entry" : "Journal Entry";
}

// Use a wrapper component because useSearchParams() requires a Suspense boundary in Next.js
export default function JournalEntryPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <JournalEntryContent />
        </Suspense>
    );
}

function JournalEntryContent() {
    const supabase = createClient();
    const params = useSearchParams();
    const questionId = params.get("questionId");

    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<string[][]>([]);
    const [fields, setFields] = useState<SimulationFieldWithOptions[]>([]);
    const [taskId, setTaskId] = useState<string | null>(null);

    const [entries, setEntries] = useState<Record<number, JournalLineInput[]>>({});
    const [narrations, setNarrations] = useState<Record<number, string>>({});
    const [showPreview, setShowPreview] = useState(false);
    const [evaluation, setEvaluation] = useState<ReturnType<typeof buildGridEvaluationResult> | null>(null);
    const [showEval, setShowEval] = useState(false);
    const [startTime] = useState(Date.now());
    const pageHeading = getJournalEntryHeading("Journal Entry");

    useEffect(() => {
        async function load() {
            try {
                if (!questionId) {
                    console.error("❌ Error: questionId is missing from the URL.");
                    setLoading(false);
                    return;
                }

                // 1. Fetch Question Data
                const { data: q, error: qErr } = await supabase
                    .from("questions")
                    .select("*")
                    .eq("id", questionId)
                    .single();

                if (qErr) {
                    console.error("❌ Supabase Questions Error:", qErr.message);
                } else {
                    console.log("✅ Question Data Loaded:", q);
                    const tableRows = q?.table_data?.rows || [];
                    setRows(tableRows);

                    // Initialize input rows
                    const init: Record<number, JournalLineInput[]> = {};
                    const narrationInit: Record<number, string> = {};
                    tableRows.forEach((_: string[], i: number) => {
                        init[i] = createDefaultJournalLines();
                        narrationInit[i] = "";
                    });
                    setEntries(init);
                    setNarrations(narrationInit);
                }

                // 2. Fetch Task Data
                const { data: task, error: tErr } = await supabase
                    .from("simulation_tasks")
                    .select("id")
                    .eq("question_id", questionId)
                    .single();

                if (tErr) {
                    console.error("❌ Supabase Tasks Error:", tErr.message);
                } else if (task) {
                    setTaskId(task.id);

                    // 3. Fetch Fields/Steps
                    const { data: step } = await supabase
                        .from("simulation_steps")
                        .select("id")
                        .eq("task_id", task.id)
                        .single();

                    if (step) {
                        const { data: f } = await supabase
                            .from("simulation_fields")
                            .select("*")
                            .eq("step_id", step.id)
                            .order("order_index");
                        setFields(f || []);
                    }
                }

            } catch (err) {
                console.error("❌ Unexpected Error:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [questionId, supabase]);

    const groupedFields = useMemo(() => normalizeGridFields(fields), [fields]);
    const options = useMemo(() => {
        const opts = fields
            .filter((field) => (field.field_name || "").toLowerCase().includes("account"))
            .flatMap((field) => (Array.isArray(field.options) ? field.options : []));
        return Array.from(new Set(opts));
    }, [fields]);

    const updateEntry = (row: number, idx: number, key: string, val: string) => {
        setEntries((prev) => {
            const updatedRow = [...prev[row]];
            updatedRow[idx] = { ...updatedRow[idx], [key]: val };
            return { ...prev, [row]: updatedRow };
        });
    };

    const addRow = (row: number) => {
        setEntries((prev) => ({
            ...prev,
            [row]: [...prev[row], { account: "", dr: "", cr: "" }]
        }));
    };

    const deleteRow = (row: number, idx: number) => {
        setEntries((prev) => {
            const updatedRow = [...prev[row]];
            if (updatedRow.length > 2) updatedRow.splice(idx, 1);
            else updatedRow[idx] = { account: "", dr: "", cr: "" };
            return { ...prev, [row]: updatedRow };
        });
    };

    async function handleSubmit() {
        if (!taskId || !questionId) {
            alert("Task ID or Question ID is missing. Cannot save attempt.");
            return;
        }
        if (groupedFields.length === 0) {
            alert("Simulation fields are not available. Cannot evaluate or save.");
            return;
        }

        const endTime = Date.now();
        const finalAnswers = buildJournalAttemptAnswers(groupedFields, entries);
        const breakdownRows = buildJournalBreakdownRows(groupedFields, entries);

        setEvaluation(buildGridEvaluationResult(breakdownRows, startTime, endTime));
        setShowEval(true);

        if (finalAnswers.length === 0) {
            return;
        }

        try {
            await saveSimulationAttempt({ questionId, taskId, startTime, endTime, answers: finalAnswers });
        } catch (e) {
            console.error("Save Error:", e);
        }
    }

    if (loading) {
        return (
            <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f5f7" }}>
                <Loader2 className="animate-spin" size={40} color="#1a3a5c" />
            </div>
        );
    }

    if (rows.length === 0) {
        return (
            <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", textAlign: "center", padding: "20px" }}>
                <AlertCircle size={48} color="#ef4444" />
                <h2 style={{ color: "#111827" }}>Data Not Found</h2>
                <p style={{ color: "#6b7280", maxWidth: "400px" }}>
                    We couldn&apos;t find row data for <b>Question ID: {questionId || "NULL"}</b>.
                    Please ensure the ID is correct and RLS policies allow access.
                </p>
                <Link href="/" style={{ color: "#1a3a5c", fontWeight: "600", marginTop: "10px" }}>Go Back Home</Link>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", background: "#f4f5f7", fontFamily: "sans-serif" }}>
            <header style={{ background: "#fff", borderBottom: "1px solid #e2e6ea", padding: "12px 24px" }}>
                <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <PrayogLogo className="h-14 w-[228px]" priority />
                        <span style={{ border: "1px solid #c7d2de", borderRadius: "6px", padding: "4px 12px", fontSize: "13px", color: "#374151", fontWeight: "500" }}>
                            {pageHeading}
                        </span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <span style={{ border: "1px solid #1a3a5c", padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>ID: {questionId}</span>
                        <button aria-label="Logout" style={{ background: "none", border: "none", color: "#6b7a8d", cursor: "pointer" }}><LogOut size={16} /></button>
                    </div>
                </div>
            </header>

            <main style={{ maxWidth: "1000px", margin: "40px auto", padding: "0 20px" }}>
                <h2 style={{ textAlign: "center", marginBottom: "30px" }}>{pageHeading}</h2>

                {!showPreview ? (
                    <div style={{ background: "#fff", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead style={{ background: "#f8f9fb" }}>
                                <tr>
                                    <th style={{ padding: "12px 20px", textAlign: "left", width: "50px" }}>#</th>
                                    <th style={{ padding: "12px 20px", textAlign: "left", width: "300px" }}>Transaction</th>
                                    <th style={{ padding: "12px 20px", textAlign: "left" }}>Entries</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, i) => (
                                    <tr key={i} style={{ borderTop: "1px solid #f0f2f5" }}>
                                        <td style={{ padding: "20px", fontWeight: "bold", color: "#9aa3af" }}>{i + 1}</td>
                                        <td style={{ padding: "20px" }}>
                                            <div style={{ fontSize: "12px", color: "#6b7280" }}>{r[1]}</div>
                                            <div style={{ fontSize: "14px", fontWeight: "500" }}>{r[2]}</div>
                                        </td>
                                        <td style={{ padding: "20px" }}>
                                            {entries[i]?.map((e, idx) => (
                                                <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                                                    <select
                                                        aria-label={`Select account for row ${i + 1} line ${idx + 1}`}
                                                        style={{ height: "36px", width: "220px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                                        value={e.account}
                                                        onChange={(ev) => updateEntry(i, idx, "account", ev.target.value)}
                                                    >
                                                        <option value="">Select Account</option>
                                                        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                    <input
                                                        style={{ height: "36px", width: "90px", borderRadius: "6px", border: "1px solid #d1d5db", padding: "0 8px" }}
                                                        placeholder="Debit" value={e.dr} onChange={(ev) => updateEntry(i, idx, "dr", ev.target.value)}
                                                    />
                                                    <input
                                                        style={{ height: "36px", width: "90px", borderRadius: "6px", border: "1px solid #d1d5db", padding: "0 8px" }}
                                                        placeholder="Credit" value={e.cr} onChange={(ev) => updateEntry(i, idx, "cr", ev.target.value)}
                                                    />
                                                    <button onClick={() => deleteRow(i, idx)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>✕</button>
                                                </div>
                                            ))}
                                            <button onClick={() => addRow(i)} style={{ border: "1px solid #d1d5db", background: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", cursor: "pointer" }}>+ Add</button>
                                            <input
                                                aria-label={`Narration for transaction ${i + 1}`}
                                                value={narrations[i] ?? ""}
                                                onChange={(event) =>
                                                    setNarrations((prev) => ({ ...prev, [i]: event.target.value }))
                                                }
                                                placeholder="Narration :"
                                                style={{
                                                    width: "100%",
                                                    height: "38px",
                                                    marginTop: "12px",
                                                    borderRadius: "8px",
                                                    border: "1px solid #d1d5db",
                                                    padding: "0 12px",
                                                    fontSize: "13px",
                                                    color: "#374151",
                                                }}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ padding: "20px", textAlign: "right", borderTop: "1px solid #f0f2f5" }}>
                            <button onClick={() => setShowPreview(true)} style={{ background: "#1a3a5c", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "20px", fontWeight: "600", cursor: "pointer" }}>Preview</button>
                        </div>
                    </div>
                ) : (
                    <div style={{ background: "#fff", borderRadius: "12px", padding: "20px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                                    <th style={{ textAlign: "left", padding: "10px" }}>Date</th>
                                    <th style={{ textAlign: "left", padding: "10px" }}>Particulars</th>
                                    <th style={{ textAlign: "right", padding: "10px" }}>Debit</th>
                                    <th style={{ textAlign: "right", padding: "10px" }}>Credit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                                        <td style={{ padding: "10px", fontSize: "13px" }}>{r[1]}</td>
                                        <td style={{ padding: "10px" }}>
                                            {entries[i]?.map((e, idx) => (
                                                <div key={idx} style={{ paddingLeft: e.cr ? "20px" : "0" }}>{e.account || "—"}</div>
                                            ))}
                                        </td>
                                        <td style={{ textAlign: "right", padding: "10px" }}>{entries[i]?.map((e, idx) => <div key={idx}>{e.dr || "—"}</div>)}</td>
                                        <td style={{ textAlign: "right", padding: "10px" }}>{entries[i]?.map((e, idx) => <div key={idx}>{e.cr || "—"}</div>)}</td>
                                    </tr>
                                ))}
                                {rows.some((_, i) => (narrations[i] ?? "").trim()) && (
                                    <tr>
                                        <td colSpan={4} style={{ padding: "0 10px 10px" }}>
                                            {rows.map((_, i) =>
                                                (narrations[i] ?? "").trim() ? (
                                                    <div key={`narration-${i}`} style={{ fontSize: "12px", color: "#6b7280", marginTop: "6px" }}>
                                                        Narration: {narrations[i]}
                                                    </div>
                                                ) : null
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between" }}>
                            <button onClick={() => setShowPreview(false)} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer" }}>← Back</button>
                            <button onClick={handleSubmit} style={{ background: "#1a3a5c", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "20px", fontWeight: "600", cursor: "pointer" }}>Validate & Save</button>
                        </div>
                    </div>
                )}
            </main>

            <EvaluationPopup open={showEval} onClose={() => setShowEval(false)} results={evaluation} variant="grid" />
            <DraggableCalculator />
        </div>
    );
}
