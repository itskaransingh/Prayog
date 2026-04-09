"use client";

import {
    Suspense,
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
    type ReactNode,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ChevronDown, Loader2, Trash2, X } from "lucide-react";

import { PrayogLogo } from "@/components/branding/prayog-logo";
import { EvaluationPopup } from "@/components/simulation/income-tax/shared/evaluation-results";
import { DraggableCalculator } from "@/components/simulation/shared/draggable-calculator";
import { saveSimulationAttempt } from "@/lib/simulation/attempts";
import { createClient } from "@/lib/supabase/client";
import {
    buildGridEvaluationResult,
    buildLedgerAttemptAnswers,
    buildLedgerBreakdownRows,
    normalizeGridFields,
    type GridFieldGroup,
    type SimulationFieldRecord,
} from "@/lib/simulation/grid-field-mapper";

interface LedgerEntry {
    id: number;
    account: string;
    amount: string;
}

interface LedgerQuestionRow {
    rowNumber: number;
    transactionDesc: string;
    debitCount: number;
    creditCount: number;
    startDebitIndex: number;
    startCreditIndex: number;
}

type SimulationFieldWithOptions = SimulationFieldRecord & {
    options?: string[] | null;
};

const actionButtonStyle: CSSProperties = {
    background: "#18345b",
    color: "#fff",
    border: "none",
    padding: "10px 32px",
    borderRadius: "999px",
    fontWeight: 600,
    fontSize: "15px",
    cursor: "pointer",
    letterSpacing: "0.02em",
    minWidth: "144px",
};

const clearButtonStyle: CSSProperties = {
    background: "#fff",
    border: "1px solid #f7c8d2",
    borderRadius: "10px",
    cursor: "pointer",
    color: "#f05d7a",
    width: "34px",
    height: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
};

function getLedgerHeading(questionTitle: string): string {
    const trimmedTitle = questionTitle.trim();
    if (!trimmedTitle || /ledger\s*creation/i.test(trimmedTitle)) {
        return "Cash Account";
    }
    return /account$/i.test(trimmedTitle) ? trimmedTitle : `${trimmedTitle} Account`;
}

function getSideCount(rowGroup: GridFieldGroup | undefined, side: "debit" | "credit") {
    if (!rowGroup) {
        return 0;
    }

    const explicitLines = side === "debit" ? rowGroup.debitLines : rowGroup.creditLines;
    if (explicitLines && explicitLines.length > 0) {
        return explicitLines.length;
    }

    if (side === "debit" && (rowGroup.debitAccount || rowGroup.debitAmount)) {
        return 1;
    }

    if (side === "credit" && (rowGroup.creditAccount || rowGroup.creditAmount)) {
        return 1;
    }

    return 0;
}

function buildLedgerQuestionRows(
    groupedFields: GridFieldGroup[],
    evidenceRows: string[][],
): LedgerQuestionRow[] {
    const rowGroupMap = new Map(groupedFields.map((rowGroup) => [rowGroup.rowNumber, rowGroup]));
    const totalRows = Math.max(groupedFields.length, evidenceRows.length, 1);
    let runningDebitIndex = 0;
    let runningCreditIndex = 0;

    return Array.from({ length: totalRows }, (_, index) => {
        const rowNumber = index + 1;
        const rowGroup = rowGroupMap.get(rowNumber);
        const debitCount = Math.max(getSideCount(rowGroup, "debit"), 1);
        const creditCount = Math.max(getSideCount(rowGroup, "credit"), 1);
        const questionRow: LedgerQuestionRow = {
            rowNumber,
            transactionDesc: evidenceRows[index]?.[1] ?? "",
            debitCount,
            creditCount,
            startDebitIndex: runningDebitIndex,
            startCreditIndex: runningCreditIndex,
        };

        runningDebitIndex += debitCount;
        runningCreditIndex += creditCount;
        return questionRow;
    });
}

function formatLedgerAmount(value: string) {
    const parsed = Number.parseFloat(value.replaceAll(",", "").trim());
    return Number.isFinite(parsed) ? parsed.toLocaleString("en-IN") : "";
}

function formatLedgerNumber(value: number) {
    return value > 0 ? value.toLocaleString("en-IN") : "";
}

function createEmptyLedgerEntries(startId: number, count: number) {
    return Array.from({ length: count }, (_, index) => ({
        id: startId + index,
        account: "",
        amount: "",
    }));
}

function getDisplayTotal(drTotal: number, crTotal: number) {
    return Math.max(drTotal, crTotal);
}

function getBalanceLine(side: "debit" | "credit", drTotal: number, crTotal: number) {
    const difference = Math.abs(drTotal - crTotal);
    if (difference <= 0) {
        return null;
    }

    if (side === "debit" && drTotal < crTotal) {
        return { label: "To Balance c/d", amount: difference };
    }

    if (side === "credit" && crTotal < drTotal) {
        return { label: "By Balance c/d", amount: difference };
    }

    return null;
}

function getPreviewEntries(entries: LedgerEntry[]) {
    return entries.filter((entry) => entry.account.trim() || entry.amount.trim());
}

export default function LedgerCreationPage() {
    return (
        <Suspense
            fallback={
                <div
                    style={{
                        height: "100vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#f4f5f7",
                    }}
                >
                    <Loader2 className="animate-spin" size={40} color="#1a3a5c" />
                </div>
            }
        >
            <LedgerCreationContent />
        </Suspense>
    );
}

function LedgerCreationContent() {
    const supabase = createClient();
    const params = useSearchParams();
    const questionId = params.get("questionId");

    const [loading, setLoading] = useState(true);
    const [questionTitle, setQuestionTitle] = useState("Cash Account");
    const [questionNo, setQuestionNo] = useState("Ledger_003AC");
    const [questionRows, setQuestionRows] = useState<string[][]>([]);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [fields, setFields] = useState<SimulationFieldWithOptions[]>([]);
    const [drEntries, setDrEntries] = useState<LedgerEntry[]>([{ id: 1, account: "", amount: "" }]);
    const [crEntries, setCrEntries] = useState<LedgerEntry[]>([{ id: 2, account: "", amount: "" }]);
    const [nextId, setNextId] = useState(3);
    const [showPreview, setShowPreview] = useState(false);
    const [evaluation, setEvaluation] = useState<ReturnType<typeof buildGridEvaluationResult> | null>(null);
    const [showEval, setShowEval] = useState(false);
    const [startTime] = useState(Date.now());

    useEffect(() => {
        async function load() {
            try {
                if (!questionId) {
                    setLoading(false);
                    return;
                }

                const { data: question } = await supabase
                    .from("questions")
                    .select("*")
                    .eq("id", questionId)
                    .single();

                if (question) {
                    setQuestionTitle(question.title || "Cash Account");
                    setQuestionRows(Array.isArray(question.table_data?.rows) ? question.table_data.rows : []);
                    setQuestionNo(
                        question.table_data?.question_no ??
                            `Ledger_${question.id.slice(-5).toUpperCase()}`,
                    );
                }

                const { data: task } = await supabase
                    .from("simulation_tasks")
                    .select("id")
                    .eq("question_id", questionId)
                    .single();

                if (task) {
                    setTaskId(task.id);

                    const { data: steps } = await supabase
                        .from("simulation_steps")
                        .select("id")
                        .eq("task_id", task.id)
                        .order("step_order");

                    const stepIds = (steps ?? []).map((step) => step.id);
                    if (stepIds.length > 0) {
                        const { data: simulationFields } = await supabase
                            .from("simulation_fields")
                            .select("*")
                            .in("step_id", stepIds)
                            .order("order_index");

                        setFields((simulationFields ?? []) as SimulationFieldWithOptions[]);
                    }
                }
            } catch (error) {
                console.error("Ledger load error:", error);
            } finally {
                setLoading(false);
            }
        }

        void load();
    }, [questionId, supabase]);

    const groupedFields = useMemo(() => normalizeGridFields(fields), [fields]);
    const ledgerQuestionRows = useMemo(
        () => buildLedgerQuestionRows(groupedFields, questionRows),
        [groupedFields, questionRows],
    );
    const requiredDebitCount = useMemo(
        () =>
            ledgerQuestionRows.length > 0
                ? ledgerQuestionRows[ledgerQuestionRows.length - 1].startDebitIndex +
                  ledgerQuestionRows[ledgerQuestionRows.length - 1].debitCount
                : 1,
        [ledgerQuestionRows],
    );
    const requiredCreditCount = useMemo(
        () =>
            ledgerQuestionRows.length > 0
                ? ledgerQuestionRows[ledgerQuestionRows.length - 1].startCreditIndex +
                  ledgerQuestionRows[ledgerQuestionRows.length - 1].creditCount
                : 1,
        [ledgerQuestionRows],
    );

    const drOptions = useMemo(() => {
        const values = fields
            .filter((field) => (field.field_name ?? "").toLowerCase().includes("debit_account"))
            .flatMap((field) => (Array.isArray(field.options) ? field.options : []));
        return Array.from(new Set(values));
    }, [fields]);

    const crOptions = useMemo(() => {
        const values = fields
            .filter((field) => (field.field_name ?? "").toLowerCase().includes("credit_account"))
            .flatMap((field) => (Array.isArray(field.options) ? field.options : []));
        return Array.from(new Set(values));
    }, [fields]);

    useEffect(() => {
        setDrEntries((prev) => {
            if (prev.length >= requiredDebitCount) {
                return prev;
            }
            const startId = prev.length > 0 ? Math.max(...prev.map((entry) => entry.id)) + 1 : 1;
            return [...prev, ...createEmptyLedgerEntries(startId, requiredDebitCount - prev.length)];
        });
        setCrEntries((prev) => {
            if (prev.length >= requiredCreditCount) {
                return prev;
            }
            const startId = prev.length > 0 ? Math.max(...prev.map((entry) => entry.id)) + 1 : 1000;
            return [...prev, ...createEmptyLedgerEntries(startId, requiredCreditCount - prev.length)];
        });
    }, [requiredCreditCount, requiredDebitCount]);

    function maybeAppendEntry(entries: LedgerEntry[], id: number) {
        const lastEntry = entries[entries.length - 1];
        if (lastEntry && lastEntry.account.trim()) {
            return [...entries, { id, account: "", amount: "" }];
        }
        return entries;
    }

    function updateDrEntry(index: number, key: keyof LedgerEntry, value: string) {
        setDrEntries((prev) => {
            const updated = prev.map((entry, currentIndex) =>
                currentIndex === index ? { ...entry, [key]: value } : entry,
            );
            if (key === "account" && value.trim() && index === prev.length - 1) {
                const appended = maybeAppendEntry(updated, nextId);
                if (appended !== updated) {
                    setNextId((current) => current + 1);
                    return appended;
                }
            }
            return updated;
        });
    }

    function updateCrEntry(index: number, key: keyof LedgerEntry, value: string) {
        setCrEntries((prev) => {
            const updated = prev.map((entry, currentIndex) =>
                currentIndex === index ? { ...entry, [key]: value } : entry,
            );
            if (key === "account" && value.trim() && index === prev.length - 1) {
                const appended = maybeAppendEntry(updated, nextId);
                if (appended !== updated) {
                    setNextId((current) => current + 1);
                    return appended;
                }
            }
            return updated;
        });
    }

    function clearDrEntry(index: number) {
        setDrEntries((prev) =>
            prev.map((entry, currentIndex) =>
                currentIndex === index ? { ...entry, account: "", amount: "" } : entry,
            ),
        );
    }

    function clearCrEntry(index: number) {
        setCrEntries((prev) =>
            prev.map((entry, currentIndex) =>
                currentIndex === index ? { ...entry, account: "", amount: "" } : entry,
            ),
        );
    }

    const drTotal = useMemo(
        () =>
            drEntries.reduce((sum, entry) => {
                const value = Number.parseFloat(entry.amount.replaceAll(",", "").trim());
                return sum + (Number.isNaN(value) ? 0 : value);
            }, 0),
        [drEntries],
    );

    const crTotal = useMemo(
        () =>
            crEntries.reduce((sum, entry) => {
                const value = Number.parseFloat(entry.amount.replaceAll(",", "").trim());
                return sum + (Number.isNaN(value) ? 0 : value);
            }, 0),
        [crEntries],
    );

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
        const debitEntries = drEntries
            .filter((entry) => entry.account.trim() || entry.amount.trim())
            .map((entry) => ({ account: entry.account.trim(), amount: entry.amount.trim() }));
        const creditEntries = crEntries
            .filter((entry) => entry.account.trim() || entry.amount.trim())
            .map((entry) => ({ account: entry.account.trim(), amount: entry.amount.trim() }));
        const answers = buildLedgerAttemptAnswers(groupedFields, debitEntries, creditEntries);
        const breakdownRows = buildLedgerBreakdownRows(groupedFields, debitEntries, creditEntries);

        setEvaluation(buildGridEvaluationResult(breakdownRows, startTime, endTime));
        setShowEval(true);

        if (answers.length === 0) {
            return;
        }

        try {
            await saveSimulationAttempt({
                questionId,
                taskId,
                startTime,
                endTime,
                answers,
            });
        } catch (error) {
            console.error("Ledger save error:", error);
        }
    }

    if (loading) {
        return (
            <div
                style={{
                    height: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f4f5f7",
                }}
            >
                <Loader2 className="animate-spin" size={40} color="#1a3a5c" />
            </div>
        );
    }

    if (!questionId) {
        return (
            <div
                style={{
                    height: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    textAlign: "center",
                    padding: "20px",
                }}
            >
                <AlertCircle size={48} color="#ef4444" />
                <h2 style={{ color: "#111827" }}>No Question ID</h2>
                <p style={{ color: "#6b7280", maxWidth: "420px" }}>
                    Please provide a valid <b>questionId</b> in the URL query parameters.
                </p>
                <Link href="/" style={{ color: "#1a3a5c", fontWeight: 600 }}>
                    Go Back Home
                </Link>
            </div>
        );
    }

    return (
        <>
            {showPreview ? (
                <PreviewPage
                    questionTitle={questionTitle}
                    questionNo={questionNo}
                    drEntries={drEntries}
                    crEntries={crEntries}
                    drTotal={drTotal}
                    crTotal={crTotal}
                    onBack={() => setShowPreview(false)}
                    onValidate={handleSubmit}
                />
            ) : (
                <EditorPage
                    questionTitle={questionTitle}
                    questionNo={questionNo}
                    drEntries={drEntries}
                    crEntries={crEntries}
                    drOptions={drOptions}
                    crOptions={crOptions}
                    drTotal={drTotal}
                    crTotal={crTotal}
                    updateDrEntry={updateDrEntry}
                    updateCrEntry={updateCrEntry}
                    clearDrEntry={clearDrEntry}
                    clearCrEntry={clearCrEntry}
                    onPreview={() => setShowPreview(true)}
                />
            )}
            <EvaluationPopup open={showEval} onClose={() => setShowEval(false)} results={evaluation} variant="grid" />
            <DraggableCalculator />
        </>
    );
}

function LedgerHeader({ questionNo }: { questionNo: string }) {
    return (
        <header
            style={{
                background: "#fff",
                borderBottom: "1px solid #e2e6ea",
                padding: "10px 24px",
            }}
        >
            <div
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <PrayogLogo className="h-16 w-[264px]" priority />
                    <span
                        style={{
                            border: "1px solid #c7d2de",
                            borderRadius: "10px",
                            padding: "7px 16px",
                            fontSize: "13px",
                            color: "#374151",
                            fontWeight: 600,
                            background: "#fff",
                        }}
                    >
                        Ledger
                    </span>
                </div>

                <div
                    style={{
                        border: "1px solid #c7d2de",
                        borderRadius: "12px",
                        padding: "7px 16px",
                        fontSize: "12px",
                        color: "#374151",
                        fontWeight: 600,
                    }}
                >
                    Question No {questionNo}
                </div>
            </div>
        </header>
    );
}

function LedgerCardFrame({ children }: { children: ReactNode }) {
    return (
        <div
            style={{
                background: "#fff",
                borderRadius: "18px",
                boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
                border: "1px solid #dde5f0",
                overflow: "hidden",
            }}
        >
            {children}
        </div>
    );
}

function LedgerPane({
    side,
    total,
    balanceLine,
    children,
}: {
    side: "debit" | "credit";
    total: number;
    balanceLine: { label: string; amount: number } | null;
    children: ReactNode;
}) {
    return (
        <div style={{ minWidth: 0, padding: "14px 18px 12px" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "14px",
                    paddingBottom: "14px",
                    borderBottom: "1px solid #e4eaf3",
                }}
            >
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#172033" }}>Particulars</div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#172033" }}>
                    {side === "debit" ? "Dr.(₹)" : "Cr.(₹)"}
                </div>
            </div>

            <div style={{ display: "grid", gap: "10px" }}>
                {children}
                {balanceLine ? (
                    <div
                        style={{
                            background: "#fff8e8",
                            border: "1px solid #f2d39b",
                            color: "#2f3640",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderRadius: "10px",
                            padding: "9px 12px",
                            marginTop: "2px",
                        }}
                    >
                        <span>{balanceLine.label}</span>
                        <span>{formatLedgerNumber(balanceLine.amount)}</span>
                    </div>
                ) : null}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#eef6ff",
                        border: "1px solid #cfe2fb",
                        borderRadius: "14px",
                        padding: "10px 14px",
                        marginTop: "4px",
                    }}
                >
                    <span style={{ fontSize: "18px", fontWeight: 800, color: "#101828" }}>Total</span>
                    <span style={{ fontSize: "16px", fontWeight: 800, color: "#101828" }}>
                        ₹ {formatLedgerNumber(total)}
                    </span>
                </div>
            </div>
        </div>
    );
}

function LedgerSelect({
    value,
    options,
    prefix,
    placeholder,
    onChange,
    onClear,
}: {
    value: string;
    options: string[];
    prefix: string;
    placeholder?: string;
    onChange: (value: string) => void;
    onClear: () => void;
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #cfd8e6",
                borderRadius: "10px",
                background: "#fff",
                height: "36px",
                flex: "1",
                minWidth: 0,
                overflow: "hidden",
                position: "relative",
                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
            }}
        >
            <span
                style={{
                    padding: "0 10px",
                    color: "#172033",
                    fontSize: "13px",
                    fontWeight: 700,
                    flexShrink: 0,
                    borderRight: "1px solid #e6edf6",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                }}
            >
                {prefix}
            </span>
            <div
                style={{
                    flex: 1,
                    padding: "0 10px",
                    fontSize: "13px",
                    color: value ? "#334155" : "#94a3b8",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    cursor: "pointer",
                }}
            >
                {value || placeholder || "Choose"}
            </div>
            {value ? (
                <button
                    onClick={(event) => {
                        event.stopPropagation();
                        onClear();
                    }}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#c1c9d6",
                        padding: "0 4px",
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                    }}
                >
                    <X size={12} />
                </button>
            ) : null}
            <span
                style={{
                    padding: "0 10px 0 6px",
                    color: "#b0bac9",
                    display: "flex",
                    alignItems: "center",
                    flexShrink: 0,
                }}
            >
                <ChevronDown size={14} />
            </span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer",
                }}
            >
                <option value="">{placeholder || "Choose"}</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
}

function AmountInput({
    value,
    onChange,
    width = "100px",
}: {
    value: string;
    onChange: (value: string) => void;
    width?: string;
}) {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #cfd8e6",
                borderRadius: "10px",
                background: "#fff",
                height: "36px",
                width,
                flexShrink: 0,
                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
            }}
        >
            <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    padding: "0 10px",
                    fontSize: "13px",
                    background: "transparent",
                    color: "#172033",
                    textAlign: "right",
                    fontWeight: 700,
                }}
            />
            <span
                style={{
                    padding: "0 10px 0 4px",
                    color: "#98a4b7",
                    fontSize: "13px",
                    flexShrink: 0,
                }}
            >
                ₹
            </span>
        </div>
    );
}

function EditorPage({
    questionTitle,
    questionNo,
    drEntries,
    crEntries,
    drOptions,
    crOptions,
    drTotal,
    crTotal,
    updateDrEntry,
    updateCrEntry,
    clearDrEntry,
    clearCrEntry,
    onPreview,
}: {
    questionTitle: string;
    questionNo: string;
    drEntries: LedgerEntry[];
    crEntries: LedgerEntry[];
    drOptions: string[];
    crOptions: string[];
    drTotal: number;
    crTotal: number;
    updateDrEntry: (index: number, key: keyof LedgerEntry, value: string) => void;
    updateCrEntry: (index: number, key: keyof LedgerEntry, value: string) => void;
    clearDrEntry: (index: number) => void;
    clearCrEntry: (index: number) => void;
    onPreview: () => void;
}) {
    const ledgerHeading = getLedgerHeading(questionTitle);
    const displayTotal = getDisplayTotal(drTotal, crTotal);
    const debitBalanceLine = getBalanceLine("debit", drTotal, crTotal);
    const creditBalanceLine = getBalanceLine("credit", drTotal, crTotal);

    return (
        <div style={{ minHeight: "100vh", background: "#f4f5f7", fontFamily: "Inter, sans-serif" }}>
            <LedgerHeader questionNo={questionNo} />

            <main
                style={{
                    maxWidth: "1130px",
                    margin: "36px auto",
                    padding: "0 20px 120px",
                }}
            >
                <h2
                    style={{
                        textAlign: "center",
                        fontSize: "22px",
                        fontWeight: 700,
                        color: "#111827",
                        marginBottom: "24px",
                    }}
                >
                    {ledgerHeading}
                </h2>

                <LedgerCardFrame>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
                        }}
                    >
                        <div style={{ borderRight: "1px solid #dde5f0" }}>
                            <LedgerPane side="debit" total={displayTotal} balanceLine={debitBalanceLine}>
                                {drEntries.map((entry, index) => (
                                    <div
                                        key={entry.id}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "minmax(0,1fr) 164px 34px",
                                            gap: "10px",
                                            alignItems: "center",
                                        }}
                                    >
                                        <LedgerSelect
                                            value={entry.account}
                                            options={drOptions}
                                            prefix="To"
                                            placeholder="Choose"
                                            onChange={(value) => updateDrEntry(index, "account", value)}
                                            onClear={() => clearDrEntry(index)}
                                        />
                                        <AmountInput
                                            value={entry.amount}
                                            onChange={(value) => updateDrEntry(index, "amount", value)}
                                            width="100%"
                                        />
                                        <button
                                            onClick={() => clearDrEntry(index)}
                                            style={clearButtonStyle}
                                            title="Clear line"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                ))}
                            </LedgerPane>
                        </div>

                        <div>
                            <LedgerPane side="credit" total={displayTotal} balanceLine={creditBalanceLine}>
                                {crEntries.map((entry, index) => (
                                    <div
                                        key={entry.id}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "minmax(0,1fr) 164px 34px",
                                            gap: "10px",
                                            alignItems: "center",
                                        }}
                                    >
                                        <LedgerSelect
                                            value={entry.account}
                                            options={crOptions}
                                            prefix="By"
                                            placeholder="Choose"
                                            onChange={(value) => updateCrEntry(index, "account", value)}
                                            onClear={() => clearCrEntry(index)}
                                        />
                                        <AmountInput
                                            value={entry.amount}
                                            onChange={(value) => updateCrEntry(index, "amount", value)}
                                            width="100%"
                                        />
                                        <button
                                            onClick={() => clearCrEntry(index)}
                                            style={clearButtonStyle}
                                            title="Clear line"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                ))}
                            </LedgerPane>
                        </div>
                    </div>
                </LedgerCardFrame>
            </main>

            <div
                style={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "#fff",
                    borderTop: "1px solid #e5e7eb",
                    padding: "16px 40px",
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                }}
            >
                <button onClick={onPreview} style={actionButtonStyle}>
                    Preview
                </button>
            </div>
        </div>
    );
}

function PreviewPage({
    questionTitle,
    questionNo,
    drEntries,
    crEntries,
    drTotal,
    crTotal,
    onBack,
    onValidate,
}: {
    questionTitle: string;
    questionNo: string;
    drEntries: LedgerEntry[];
    crEntries: LedgerEntry[];
    drTotal: number;
    crTotal: number;
    onBack: () => void;
    onValidate: () => void;
}) {
    const ledgerHeading = getLedgerHeading(questionTitle);
    const displayTotal = getDisplayTotal(drTotal, crTotal);
    const debitBalanceLine = getBalanceLine("debit", drTotal, crTotal);
    const creditBalanceLine = getBalanceLine("credit", drTotal, crTotal);
    const previewDebitEntries = getPreviewEntries(drEntries);
    const previewCreditEntries = getPreviewEntries(crEntries);

    return (
        <div style={{ minHeight: "100vh", background: "#f4f5f7", fontFamily: "Inter, sans-serif" }}>
            <LedgerHeader questionNo={questionNo} />

            <main
                style={{
                    maxWidth: "1130px",
                    margin: "36px auto",
                    padding: "0 20px 120px",
                }}
            >
                <h2
                    style={{
                        textAlign: "center",
                        fontSize: "22px",
                        fontWeight: 700,
                        color: "#111827",
                        marginBottom: "24px",
                    }}
                >
                    {ledgerHeading}
                </h2>

                <LedgerCardFrame>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
                        }}
                    >
                        <div style={{ borderRight: "1px solid #dde5f0" }}>
                            <LedgerPane side="debit" total={displayTotal} balanceLine={debitBalanceLine}>
                                {previewDebitEntries.map((entry, index) => (
                                    <div
                                        key={`preview-dr-${entry.id}-${index}`}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: "14px",
                                            padding: "2px 0",
                                            minHeight: "34px",
                                        }}
                                    >
                                        <span style={{ fontSize: "15px", fontWeight: 600, color: "#26364d" }}>
                                            To {entry.account}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: "15px",
                                                fontWeight: 700,
                                                color: "#26364d",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            ₹ {formatLedgerAmount(entry.amount)}
                                        </span>
                                    </div>
                                ))}
                            </LedgerPane>
                        </div>

                        <div>
                            <LedgerPane side="credit" total={displayTotal} balanceLine={creditBalanceLine}>
                                {previewCreditEntries.map((entry, index) => (
                                    <div
                                        key={`preview-cr-${entry.id}-${index}`}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            gap: "14px",
                                            padding: "2px 0",
                                            minHeight: "34px",
                                        }}
                                    >
                                        <span style={{ fontSize: "15px", fontWeight: 600, color: "#26364d" }}>
                                            By {entry.account}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: "15px",
                                                fontWeight: 700,
                                                color: "#26364d",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            ₹ {formatLedgerAmount(entry.amount)}
                                        </span>
                                    </div>
                                ))}
                            </LedgerPane>
                        </div>
                    </div>
                </LedgerCardFrame>
            </main>

            <div
                style={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "#fff",
                    borderTop: "1px solid #e5e7eb",
                    padding: "16px 40px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <button
                    onClick={onBack}
                    style={{
                        background: "none",
                        border: "none",
                        color: "#374151",
                        fontSize: "14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontWeight: 500,
                    }}
                >
                    ‹ Back
                </button>
                <button onClick={onValidate} style={actionButtonStyle}>
                    Validate
                </button>
            </div>
        </div>
    );
}
