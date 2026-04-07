"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { evaluateRegistration } from "@/lib/evaluation";
import { saveSimulationAttempt } from "@/lib/simulation/attempts";
import { EvaluationPopup } from "@/components/simulation/income-tax/shared/evaluation-results";
import Link from "next/link";
import { LogOut, Loader2, AlertCircle } from "lucide-react";

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
    const [rows, setRows] = useState<any[]>([]);
    const [fields, setFields] = useState<any[]>([]);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [correctData, setCorrectData] = useState<any>(null);

    const [entries, setEntries] = useState<Record<number, any[]>>({});
    const [showPreview, setShowPreview] = useState(false);
    const [evaluation, setEvaluation] = useState<any>(null);
    const [showEval, setShowEval] = useState(false);
    const [startTime] = useState(Date.now());

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
                    setCorrectData(q?.solution_data || {});

                    // Initialize input rows
                    const init: any = {};
                    tableRows.forEach((_: any, i: number) => {
                        init[i] = [{ account: "", dr: "", cr: "" }];
                    });
                    setEntries(init);
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

    const options = useMemo(() => {
        // Try to find the field that contains "account" in its name
        const accField = fields.find((f) =>
            f.field_name?.toLowerCase().includes("account") ||
            f.field_label?.toLowerCase().includes("account")
        );
        return accField?.options || [];
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
            if (updatedRow.length > 1) updatedRow.splice(idx, 1);
            else updatedRow[0] = { account: "", dr: "", cr: "" };
            return { ...prev, [row]: updatedRow };
        });
    };

    async function handleSubmit() {
        if (!taskId || !questionId) {
            alert("Task ID or Question ID is missing. Cannot save attempt.");
            return;
        }

        const endTime = Date.now();
        const evalMappings: any[] = [];
        const finalAnswers: any[] = [];

        Object.entries(entries).forEach(([rowIndex, rowItems]) => {
            rowItems.forEach((entry, idx) => {
                const baseId = `r${rowIndex}_i${idx}`;
                if (entry.account) {
                    evalMappings.push({ fieldPath: `row_${rowIndex}_account`, entered_value: entry.account, label: `Row ${+rowIndex + 1} Account`, expectedValue: "" });
                    finalAnswers.push({ field_id: `${baseId}_acc`, entered_value: entry.account });
                }
                if (entry.dr) {
                    evalMappings.push({ fieldPath: `row_${rowIndex}_debit`, entered_value: entry.dr, label: `Row ${+rowIndex + 1} Debit`, expectedValue: "" });
                    finalAnswers.push({ field_id: `${baseId}_dr`, entered_value: entry.dr.toString() });
                }
                if (entry.cr) {
                    evalMappings.push({ fieldPath: `row_${rowIndex}_credit`, entered_value: entry.cr, label: `Row ${+rowIndex + 1} Credit`, expectedValue: "" });
                    finalAnswers.push({ field_id: `${baseId}_cr`, entered_value: entry.cr.toString() });
                }
            });
        });

        const result = evaluateRegistration(correctData, startTime, endTime, evalMappings);
        setEvaluation(result);
        setShowEval(true);

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
                    We couldn't find row data for <b>Question ID: {questionId || "NULL"}</b>.
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
                        <div style={{ background: "#1a3a5c", color: "#fff", padding: "4px 10px", borderRadius: "6px", fontWeight: "bold" }}>P</div>
                        <span style={{ fontWeight: "bold", color: "#1a3a5c" }}>Prayog</span>
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <span style={{ border: "1px solid #1a3a5c", padding: "4px 12px", borderRadius: "20px", fontSize: "12px" }}>ID: {questionId}</span>
                        <button style={{ background: "none", border: "none", color: "#6b7a8d", cursor: "pointer" }}><LogOut size={16} /></button>
                    </div>
                </div>
            </header>

            <main style={{ maxWidth: "1000px", margin: "40px auto", padding: "0 20px" }}>
                <h2 style={{ textAlign: "center", marginBottom: "30px" }}>Journal Entry</h2>

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
                                            <button onClick={() => addRow(i)} style={{ border: "1px solid #d1d5db", background: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", cursor: "pointer" }}>+ Add Line</button>
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
                            </tbody>
                        </table>
                        <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between" }}>
                            <button onClick={() => setShowPreview(false)} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer" }}>← Back</button>
                            <button onClick={handleSubmit} style={{ background: "#1a3a5c", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "20px", fontWeight: "600", cursor: "pointer" }}>Validate & Save</button>
                        </div>
                    </div>
                )}
            </main>

            <EvaluationPopup open={showEval} onClose={() => setShowEval(false)} results={evaluation} />
        </div>
    );
}