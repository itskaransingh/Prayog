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
  buildLedgerAttemptAnswers,
  buildLedgerBreakdownRows,
  normalizeGridFields,
  type SimulationFieldRecord,
} from "@/lib/simulation/grid-field-mapper";
import { Loader2, AlertCircle, Trash2, ChevronDown, X } from "lucide-react";

// ---------- Types ----------
interface LedgerEntry {
  id: number;
  account: string;
  amount: string;
}

type SimulationFieldWithOptions = SimulationFieldRecord & {
  options?: string[] | null;
};

// ---------- Wrapper ----------
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

// ---------- Main Content ----------
function LedgerCreationContent() {
  const supabase = createClient();
  const params = useSearchParams();
  const questionId = params.get("questionId");

  const [loading, setLoading] = useState(true);
  const [questionTitle, setQuestionTitle] = useState("Cash Account");
  const [questionNo, setQuestionNo] = useState("Ledger_003AC");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [fields, setFields] = useState<SimulationFieldWithOptions[]>([]);

  // Each side: array of {id, account, amount}
  const [drEntries, setDrEntries] = useState<LedgerEntry[]>([
    { id: 1, account: "", amount: "" },
  ]);
  const [crEntries, setCrEntries] = useState<LedgerEntry[]>([
    { id: 1, account: "", amount: "" },
  ]);

  const [showPreview, setShowPreview] = useState(false);
  const [nextId, setNextId] = useState(2);
  const [evaluation, setEvaluation] = useState<ReturnType<typeof buildGridEvaluationResult> | null>(null);
  const [showEval, setShowEval] = useState(false);
  const [startTime] = useState(Date.now());

  // ---------- Data fetch ----------
  useEffect(() => {
    async function load() {
      try {
        if (!questionId) {
          setLoading(false);
          return;
        }

        // 1. Fetch question
        const { data: q, error: qErr } = await supabase
          .from("questions")
          .select("*")
          .eq("id", questionId)
          .single();

        if (qErr) {
          console.error("❌ Questions Error:", qErr.message);
        } else if (q) {
          setQuestionTitle(q.title || "Cash Account");
          // Derive question no from table_data or use id suffix
          const qno =
            q.table_data?.question_no ||
            `Ledger_${q.id.slice(-5).toUpperCase()}`;
          setQuestionNo(qno);
        }

        // 2. Fetch task
        const { data: task, error: tErr } = await supabase
          .from("simulation_tasks")
          .select("id")
          .eq("question_id", questionId)
          .single();

        if (tErr) {
          console.error("❌ Task Error:", tErr.message);
        } else if (task) {
          setTaskId(task.id);
          // 3. Fetch steps
          const { data: steps } = await supabase
            .from("simulation_steps")
            .select("id, step_order, title")
            .eq("task_id", task.id)
            .order("step_order");

          if (steps && steps.length > 0) {
            // Fetch all fields for all steps
            const stepIds = steps.map((s) => s.id);
            const { data: fields } = await supabase
              .from("simulation_fields")
              .select("*")
              .in("step_id", stepIds)
              .order("order_index");

            if (fields && fields.length > 0) {
              setFields(fields);
            }
          }
        }
      } catch (err) {
        console.error("❌ Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [questionId, supabase]);

  const groupedFields = useMemo(() => normalizeGridFields(fields), [fields]);
  const drOptions = useMemo(() => {
    const options = fields
      .filter((field) => field.field_name?.toLowerCase().includes("debit_account"))
      .flatMap((field) => (Array.isArray(field.options) ? field.options : []));
    return Array.from(new Set(options));
  }, [fields]);
  const crOptions = useMemo(() => {
    const options = fields
      .filter((field) => field.field_name?.toLowerCase().includes("credit_account"))
      .flatMap((field) => (Array.isArray(field.options) ? field.options : []));
    return Array.from(new Set(options));
  }, [fields]);

  // ---------- Cascading logic ----------
  // Add a new row when the last entry's account is filled
  function maybeAddDrRow(entries: LedgerEntry[], id: number) {
    const lastEntry = entries[entries.length - 1];
    if (lastEntry && lastEntry.account !== "") {
      const newId = id;
      setNextId((prev) => prev + 1);
      return [...entries, { id: newId, account: "", amount: "" }];
    }
    return entries;
  }

  function maybeAddCrRow(entries: LedgerEntry[], id: number) {
    const lastEntry = entries[entries.length - 1];
    if (lastEntry && lastEntry.account !== "") {
      const newId = id;
      setNextId((prev) => prev + 1);
      return [...entries, { id: newId, account: "", amount: "" }];
    }
    return entries;
  }

  function updateDrEntry(
    idx: number,
    key: keyof LedgerEntry,
    val: string
  ) {
    setDrEntries((prev) => {
      const updated = prev.map((e, i) =>
        i === idx ? { ...e, [key]: val } : e
      );
      if (key === "account" && val !== "" && idx === prev.length - 1) {
        return maybeAddDrRow(updated, nextId);
      }
      return updated;
    });
    if (key === "account" && val !== "" && idx === drEntries.length - 1) {
      setNextId((n) => n + 1);
    }
  }

  function updateCrEntry(
    idx: number,
    key: keyof LedgerEntry,
    val: string
  ) {
    setCrEntries((prev) => {
      const updated = prev.map((e, i) =>
        i === idx ? { ...e, [key]: val } : e
      );
      if (key === "account" && val !== "" && idx === prev.length - 1) {
        return maybeAddCrRow(updated, nextId + 1);
      }
      return updated;
    });
    if (key === "account" && val !== "" && idx === crEntries.length - 1) {
      setNextId((n) => n + 2);
    }
  }

  function deleteDrEntry(idx: number) {
    setDrEntries((prev) => {
      if (prev.length === 1) return [{ id: prev[0].id, account: "", amount: "" }];
      return prev.filter((_, i) => i !== idx);
    });
  }

  function deleteCrEntry(idx: number) {
    setCrEntries((prev) => {
      if (prev.length === 1) return [{ id: prev[0].id, account: "", amount: "" }];
      return prev.filter((_, i) => i !== idx);
    });
  }

  // ---------- Totals ----------
  const drTotal = drEntries.reduce((sum, e) => {
    const v = parseFloat(e.amount);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  const crTotal = crEntries.reduce((sum, e) => {
    const v = parseFloat(e.amount);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

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
    const answers = buildLedgerAttemptAnswers(groupedFields, drEntries, crEntries);
    const breakdownRows = buildLedgerBreakdownRows(groupedFields, drEntries, crEntries);

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
      console.error("Save Error:", error);
    }
  }

  // ---------- Loading ----------
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
          padding: "20px",
          textAlign: "center",
        }}
      >
        <AlertCircle size={48} color="#ef4444" />
        <h2 style={{ color: "#111827" }}>No Question ID</h2>
        <p style={{ color: "#6b7280", maxWidth: "400px" }}>
          Please provide a <b>questionId</b> in the URL query parameters.
        </p>
      </div>
    );
  }

  // ---------- Preview or Editor ----------
  if (showPreview) {
    return (
      <>
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
        <EvaluationPopup
          open={showEval}
          onClose={() => setShowEval(false)}
          results={evaluation}
          variant="grid"
        />
        <DraggableCalculator />
      </>
    );
  }

  return (
    <>
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
        deleteDrEntry={deleteDrEntry}
        deleteCrEntry={deleteCrEntry}
        onPreview={() => setShowPreview(true)}
      />
      <EvaluationPopup
        open={showEval}
        onClose={() => setShowEval(false)}
        results={evaluation}
        variant="grid"
      />
      <DraggableCalculator />
    </>
  );
}

// ---------- Header (identical to render1a style but with Ledger badge) ----------
function LedgerHeader({
  questionNo,
}: {
  questionNo: string;
}) {
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
        {/* Left: Logo + Ledger badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <PrayogLogo className="h-14 w-[228px]" priority />
          {/* Ledger badge */}
          <span
            style={{
              border: "1px solid #c7d2de",
              borderRadius: "6px",
              padding: "3px 12px",
              fontSize: "13px",
              color: "#374151",
              fontWeight: "500",
              marginLeft: "4px",
            }}
          >
            Ledger
          </span>
        </div>

        {/* Right: Question No pill */}
        <div
          style={{
            border: "1px solid #c7d2de",
            borderRadius: "20px",
            padding: "5px 16px",
            fontSize: "12px",
            color: "#374151",
            fontWeight: "500",
          }}
        >
          Question No {questionNo}
        </div>
      </div>
    </header>
  );
}

// ---------- Custom Select Dropdown ----------
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
  onChange: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        background: "#fff",
        height: "34px",
        flex: "1",
        minWidth: 0,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Prefix */}
      <span
        style={{
          padding: "0 8px",
          color: "#374151",
          fontSize: "13px",
          fontWeight: "500",
          flexShrink: 0,
          borderRight: "1px solid #e5e7eb",
          height: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        {prefix}
      </span>

      {/* Selected value or placeholder */}
      <div
        style={{
          flex: 1,
          padding: "0 6px",
          fontSize: "13px",
          color: value ? "#1e40af" : "#9ca3af",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          cursor: "pointer",
        }}
      >
        {value || placeholder || "Choose"}
      </div>

      {/* Clear button if value selected */}
      {value && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#9ca3af",
            padding: "0 4px",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <X size={12} />
        </button>
      )}

      {/* Chevron */}
      <span
        style={{
          padding: "0 6px",
          color: "#9ca3af",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <ChevronDown size={14} />
      </span>

      {/* Native select overlay for functionality */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------- Amount Input ----------
function AmountInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        background: disabled ? "#f9fafb" : "#fff",
        height: "34px",
        width: "100px",
        flexShrink: 0,
      }}
    >
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder=""
        style={{
          border: "none",
          outline: "none",
          width: "100%",
          padding: "0 6px",
          fontSize: "13px",
          background: "transparent",
          color: "#374151",
        }}
      />
      <span
        style={{
          padding: "0 6px",
          color: "#9ca3af",
          fontSize: "13px",
          flexShrink: 0,
        }}
      >
        ₹
      </span>
    </div>
  );
}

// ---------- Editor Page ----------
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
  deleteDrEntry,
  deleteCrEntry,
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
  updateDrEntry: (idx: number, key: keyof LedgerEntry, val: string) => void;
  updateCrEntry: (idx: number, key: keyof LedgerEntry, val: string) => void;
  deleteDrEntry: (idx: number) => void;
  deleteCrEntry: (idx: number) => void;
  onPreview: () => void;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f7", fontFamily: "Inter, sans-serif" }}>
      <LedgerHeader questionNo={questionNo} />

      <main style={{ maxWidth: "1060px", margin: "36px auto", padding: "0 20px" }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: "22px",
            fontWeight: "600",
            color: "#111827",
            marginBottom: "24px",
          }}
        >
          {questionTitle}
        </h2>

        {/* Ledger Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "10px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex" }}>
            {/* =========== DEBIT SIDE =========== */}
            <div
              style={{
                flex: 1,
                borderRight: "1px solid #e5e7eb",
                minWidth: 0,
              }}
            >
              {/* Dr Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  borderBottom: "1px solid #e5e7eb",
                  background: "#f9fafb",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    fontWeight: "600",
                    fontSize: "14px",
                    color: "#111827",
                  }}
                >
                  Particulars
                </div>
                <div
                  style={{
                    fontWeight: "600",
                    fontSize: "14px",
                    color: "#111827",
                    flexShrink: 0,
                  }}
                >
                  Dr.(₹)
                </div>
              </div>

              {/* Dr Rows */}
              <div style={{ padding: "10px 16px" }}>
                {drEntries.map((entry, idx) => (
                  <div
                    key={entry.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <LedgerSelect
                      value={entry.account}
                      options={drOptions}
                      prefix="To"
                      placeholder="Choose"
                      onChange={(v) => updateDrEntry(idx, "account", v)}
                      onClear={() => updateDrEntry(idx, "account", "")}
                    />
                    <AmountInput
                      value={entry.amount}
                      onChange={(v) => updateDrEntry(idx, "amount", v)}
                    />
                    <button
                      onClick={() => deleteDrEntry(idx)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                      }}
                      title="Delete row"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                {/* Spacer for balance */}
                <div style={{ height: "8px" }} />
              </div>

              {/* Dr Total */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  borderTop: "1px solid #e5e7eb",
                  background: "#f9fafb",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    fontWeight: "700",
                    fontSize: "14px",
                    color: "#111827",
                  }}
                >
                  Total
                </div>
                <div
                  style={{
                    fontWeight: "600",
                    fontSize: "14px",
                    color: "#111827",
                  }}
                >
                  ₹ {drTotal > 0 ? drTotal.toLocaleString("en-IN") : ""}
                </div>
              </div>
            </div>

            {/* =========== CREDIT SIDE =========== */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Cr Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  borderBottom: "1px solid #e5e7eb",
                  background: "#f9fafb",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    fontWeight: "600",
                    fontSize: "14px",
                    color: "#111827",
                  }}
                >
                  Particulars
                </div>
                <div
                  style={{
                    fontWeight: "600",
                    fontSize: "14px",
                    color: "#111827",
                    flexShrink: 0,
                  }}
                >
                  Cr.(₹)
                </div>
              </div>

              {/* Cr Rows */}
              <div style={{ padding: "10px 16px" }}>
                {crEntries.map((entry, idx) => (
                  <div
                    key={entry.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <LedgerSelect
                      value={entry.account}
                      options={crOptions}
                      prefix="By"
                      placeholder="Choose"
                      onChange={(v) => updateCrEntry(idx, "account", v)}
                      onClear={() => updateCrEntry(idx, "account", "")}
                    />
                    <AmountInput
                      value={entry.amount}
                      onChange={(v) => updateCrEntry(idx, "amount", v)}
                    />
                    <button
                      onClick={() => deleteCrEntry(idx)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        flexShrink: 0,
                      }}
                      title="Delete row"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                {/* Spacer */}
                <div style={{ height: "8px" }} />
              </div>

              {/* Cr Total */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  borderTop: "1px solid #e5e7eb",
                  background: "#f9fafb",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    fontWeight: "700",
                    fontSize: "14px",
                    color: "#111827",
                  }}
                >
                  Total
                </div>
                <div
                  style={{
                    fontWeight: "600",
                    fontSize: "14px",
                    color: "#111827",
                  }}
                >
                  ₹ {crTotal > 0 ? crTotal.toLocaleString("en-IN") : ""}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notepad icon bottom-right (decorative, as in screenshot) */}
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            right: "24px",
            width: "42px",
            height: "42px",
            background: "#fff",
            borderRadius: "50%",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            border: "1px solid #e5e7eb",
          }}
          title="Notes"
        >
          <span style={{ fontSize: "18px" }}>📋</span>
        </div>
      </main>

      {/* Bottom Bar */}
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
        <button
          onClick={onPreview}
          style={{
            background: "#1a3a5c",
            color: "#fff",
            border: "none",
            padding: "10px 32px",
            borderRadius: "24px",
            fontWeight: "600",
            fontSize: "15px",
            cursor: "pointer",
            letterSpacing: "0.02em",
          }}
        >
          Preview
        </button>
      </div>
    </div>
  );
}

// ---------- Preview Page ----------
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
  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f7", fontFamily: "Inter, sans-serif" }}>
      <LedgerHeader questionNo={questionNo} />

      <main style={{ maxWidth: "1060px", margin: "36px auto", padding: "0 20px" }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: "22px",
            fontWeight: "600",
            color: "#111827",
            marginBottom: "24px",
          }}
        >
          {questionTitle}
        </h2>

        {/* Preview Ledger Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "10px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex" }}>
            {/* ====== Debit Preview ====== */}
            <div style={{ flex: 1, borderRight: "1px solid #e5e7eb", minWidth: 0 }}>
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  padding: "12px 20px",
                  background: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <div style={{ flex: 1, fontWeight: "600", fontSize: "14px", color: "#111827" }}>
                  Particulars
                </div>
                <div style={{ fontWeight: "600", fontSize: "14px", color: "#111827" }}>
                  Dr.(₹)
                </div>
              </div>

              {/* Rows */}
              {drEntries
                .filter((e) => e.account)
                .map((entry, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      padding: "10px 20px",
                      borderBottom: "1px solid #f3f4f6",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1, fontSize: "14px", color: "#1e40af" }}>
                      To {entry.account}
                    </div>
                    <div style={{ fontSize: "14px", color: "#374151" }}>
                      ₹ {entry.amount ? parseFloat(entry.amount).toLocaleString("en-IN") : 0}
                    </div>
                  </div>
                ))}

              {/* Empty spacer if no entries */}
              {drEntries.filter((e) => e.account).length === 0 && (
                <div style={{ padding: "16px 20px", color: "#9ca3af", fontSize: "13px" }}>
                  No debit entries
                </div>
              )}

              {/* Padding row */}
              <div style={{ height: "12px" }} />

              {/* Total */}
              <div
                style={{
                  display: "flex",
                  padding: "12px 20px",
                  borderTop: "1px solid #e5e7eb",
                  background: "#f9fafb",
                }}
              >
                <div style={{ flex: 1, fontWeight: "700", fontSize: "14px", color: "#111827" }}>
                  Total
                </div>
                <div style={{ fontWeight: "600", fontSize: "14px", color: "#111827" }}>
                  ₹ {drTotal > 0 ? drTotal.toLocaleString("en-IN") : ""}
                </div>
              </div>
            </div>

            {/* ====== Credit Preview ====== */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  padding: "12px 20px",
                  background: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <div style={{ flex: 1, fontWeight: "600", fontSize: "14px", color: "#111827" }}>
                  Particulars
                </div>
                <div style={{ fontWeight: "600", fontSize: "14px", color: "#111827" }}>
                  Cr.(₹)
                </div>
              </div>

              {/* Rows */}
              {crEntries
                .filter((e) => e.account)
                .map((entry, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      padding: "10px 20px",
                      borderBottom: "1px solid #f3f4f6",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1, fontSize: "14px", color: "#1e40af" }}>
                      By {entry.account}
                    </div>
                    <div style={{ fontSize: "14px", color: "#374151" }}>
                      ₹ {entry.amount ? parseFloat(entry.amount).toLocaleString("en-IN") : 0}
                    </div>
                  </div>
                ))}

              {/* Empty message */}
              {crEntries.filter((e) => e.account).length === 0 && (
                <div style={{ padding: "16px 20px", color: "#9ca3af", fontSize: "13px" }}>
                  No credit entries
                </div>
              )}

              {/* Padding */}
              <div style={{ height: "12px" }} />

              {/* Total */}
              <div
                style={{
                  display: "flex",
                  padding: "12px 20px",
                  borderTop: "1px solid #e5e7eb",
                  background: "#f9fafb",
                }}
              >
                <div style={{ flex: 1, fontWeight: "700", fontSize: "14px", color: "#111827" }}>
                  Total
                </div>
                <div style={{ fontWeight: "600", fontSize: "14px", color: "#111827" }}>
                  ₹ {crTotal > 0 ? crTotal.toLocaleString("en-IN") : ""}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Bar: Back + Validate */}
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
            fontWeight: "500",
          }}
        >
          ‹ Back
        </button>
        <button
          onClick={onValidate}
          style={{
            background: "#1a3a5c",
            color: "#fff",
            border: "none",
            padding: "10px 32px",
            borderRadius: "24px",
            fontWeight: "600",
            fontSize: "15px",
            cursor: "pointer",
            letterSpacing: "0.02em",
          }}
        >
          Validate
        </button>
      </div>
    </div>
  );
}
