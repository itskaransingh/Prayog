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
  buildTrialBalanceBreakdownRows,
  normalizeGridFields,
  type JournalLineInput,
  type SimulationFieldRecord,
} from "@/lib/simulation/grid-field-mapper";
import { Loader2, AlertCircle, Trash2, ChevronDown } from "lucide-react";

type SimulationFieldWithOptions = SimulationFieldRecord & { options?: string[] | null };

interface TBRow {
  id: number;
  account: string;
  debit: string;
  credit: string;
}

function createTrialBalanceRows(count: number): TBRow[] {
  return Array.from({ length: Math.max(count, 1) }, (_, index) => ({
    id: index + 1,
    account: "",
    debit: "",
    credit: "",
  }));
}

function getTrialBalanceHeading(questionTitle: string): string {
  if (!questionTitle.trim() || /preparation\s+of\s+trial\s+balance/i.test(questionTitle)) {
    return "Trial Balance";
  }
  return questionTitle;
}

// ─── Wrapper ────────────────────────────────────────────────────────────────
export default function TrialBalancePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <TrialBalanceContent />
    </Suspense>
  );
}

// ─── Main Content ────────────────────────────────────────────────────────────
function TrialBalanceContent() {
  const supabase = createClient();
  const params = useSearchParams();
  const questionId = params.get("questionId");

  const [loading, setLoading] = useState(true);
  const [questionTitle, setQuestionTitle] = useState("Trial Balance");
  const [questionNo, setQuestionNo] = useState("TB_000");
  const [taskLineItemCount, setTaskLineItemCount] = useState(0);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [fields, setFields] = useState<SimulationFieldWithOptions[]>([]);
  const [rows, setRows] = useState<TBRow[]>(createTrialBalanceRows(1));
  const [showPreview, setShowPreview] = useState(false);
  const [evaluation, setEvaluation] = useState<ReturnType<typeof buildGridEvaluationResult> | null>(null);
  const [showEval, setShowEval] = useState(false);
  const [startTime] = useState(Date.now());
  const displayTitle = getTrialBalanceHeading(questionTitle);

  // ─── Data fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        if (!questionId) { setLoading(false); return; }

        const { data: q } = await supabase
          .from("questions").select("*").eq("id", questionId).single();

        if (q) {
          setQuestionTitle(q.title || q.paragraph || "Trial Balance");
          setTaskLineItemCount(Array.isArray(q.table_data?.rows) ? q.table_data.rows.length : 0);
          setQuestionNo(
            q.table_data?.question_no ?? `TB_${q.id.slice(-5).toUpperCase()}`
          );
        }

        const { data: task } = await supabase
          .from("simulation_tasks").select("id").eq("question_id", questionId).single();

        if (task) {
          setTaskId(task.id);
          const { data: steps } = await supabase
            .from("simulation_steps").select("id")
            .eq("task_id", task.id).order("step_order");

          if (steps?.length) {
            const { data: f } = await supabase
              .from("simulation_fields").select("*")
              .in("step_id", steps.map((s) => s.id)).order("order_index");
            if (f) setFields(f);
          }
        }
      } catch (err) {
        console.error("TB load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [questionId, supabase]);

  // ─── Derived ─────────────────────────────────────────────────────────────
  const groupedFields = useMemo(() => normalizeGridFields(fields), [fields]);
  const requiredRowCount = useMemo(
    () => Math.max(groupedFields.length, taskLineItemCount, 1),
    [groupedFields.length, taskLineItemCount],
  );

  const options = useMemo(() => {
    const opts = fields
      .filter((f) => f.field_name?.toLowerCase().includes("account"))
      .flatMap((f) => (Array.isArray(f.options) ? f.options : []));
    return Array.from(new Set(opts));
  }, [fields]);

  const debitTotal = rows.reduce((s, r) => s + (parseFloat(r.debit) || 0), 0);
  const creditTotal = rows.reduce((s, r) => s + (parseFloat(r.credit) || 0), 0);

  useEffect(() => {
    setRows((prev) => {
      const hasAnyInput = prev.some((row) => row.account || row.debit || row.credit);
      if (hasAnyInput && prev.length === requiredRowCount) {
        return prev;
      }
      if (hasAnyInput) {
        return prev;
      }
      return createTrialBalanceRows(requiredRowCount);
    });
  }, [requiredRowCount]);

  // ─── Row actions ─────────────────────────────────────────────────────────
  function updateRow(idx: number, key: keyof TBRow, val: string) {
    setRows((prev) => {
      return prev.map((r, i) => (i === idx ? { ...r, [key]: val } : r));
    });
  }

  function deleteRow(idx: number) {
    setRows((prev) => {
      return prev.map((row, rowIndex) =>
        rowIndex === idx ? { ...row, account: "", debit: "", credit: "" } : row
      );
    });
  }

  // ─── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!taskId || !questionId) {
      alert("Task ID or Question ID is missing.");
      return;
    }
    if (groupedFields.length === 0) {
      alert("Simulation fields are not available. Cannot evaluate or save.");
      return;
    }
    const endTime = Date.now();
    const entriesByRow: Record<number, JournalLineInput[]> = {};
    rows.forEach((row, idx) => {
      entriesByRow[idx] = [{ account: row.account, dr: row.debit, cr: row.credit }];
    });

    const answers = buildJournalAttemptAnswers(groupedFields, entriesByRow);
    const breakdownRows = buildTrialBalanceBreakdownRows(groupedFields, entriesByRow);
    setEvaluation(buildGridEvaluationResult(breakdownRows, startTime, endTime));
    setShowEval(true);

    if (answers.length === 0) {
      alert("No simulation answers could be mapped from the current trial balance fields.");
      return;
    }

    try {
      await saveSimulationAttempt({ questionId, taskId, startTime, endTime, answers });
    } catch (e) {
      console.error("Save error:", e);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;
  if (!questionId) return <ErrorScreen message="No questionId found in URL." />;

  return (
    <>
      {showPreview ? (
        <PreviewPage
          questionTitle={displayTitle}
          questionNo={questionNo}
          rows={rows}
          debitTotal={debitTotal}
          creditTotal={creditTotal}
          onBack={() => setShowPreview(false)}
          onValidate={handleSubmit}
        />
      ) : (
        <EditorPage
          questionTitle={displayTitle}
          questionNo={questionNo}
          rows={rows}
          options={options}
          debitTotal={debitTotal}
          creditTotal={creditTotal}
          updateRow={updateRow}
          deleteRow={deleteRow}
          onPreview={() => setShowPreview(true)}
        />
      )}
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

// ─── Header ──────────────────────────────────────────────────────────────────
function TBHeader({
  questionNo,
  titleLabel,
}: {
  questionNo: string;
  titleLabel: string;
}) {
  return (
    <header
      style={{
        background: "#fff",
        borderBottom: "1px solid #e2e6ea",
        padding: "10px 24px",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <PrayogLogo className="h-14 w-[228px]" priority />
          <span
            style={{
              border: "1px solid #c7d2de",
              borderRadius: "6px",
              padding: "4px 14px",
              fontSize: "13px",
              color: "#374151",
              fontWeight: "500",
            }}
          >
            {titleLabel}
          </span>
        </div>
        <div
          style={{
            border: "1px solid #c7d2de",
            borderRadius: "20px",
            padding: "5px 18px",
            fontSize: "13px",
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

// ─── Editor Page ──────────────────────────────────────────────────────────────
function EditorPage({
  questionTitle,
  questionNo,
  rows,
  options,
  debitTotal,
  creditTotal,
  updateRow,
  deleteRow,
  onPreview,
}: {
  questionTitle: string;
  questionNo: string;
  rows: TBRow[];
  options: string[];
  debitTotal: number;
  creditTotal: number;
  updateRow: (idx: number, key: keyof TBRow, val: string) => void;
  deleteRow: (idx: number) => void;
  onPreview: () => void;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f7", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <TBHeader questionNo={questionNo} titleLabel={questionTitle} />
      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "36px 20px 80px" }}>
        <h2
          style={{
            textAlign: "center",
            fontWeight: "700",
            fontSize: "20px",
            color: "#111827",
            marginBottom: "28px",
            letterSpacing: "-0.01em",
          }}
        >
          {questionTitle}
        </h2>

        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 1px 6px rgba(0,0,0,0.04)",
            overflow: "hidden",
            border: "1px solid #e9ecef",
          }}
        >
          {/* Column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 155px 155px 42px",
              background: "#f8f9fb",
              borderBottom: "1px solid #e5e7eb",
              padding: "11px 16px",
              gap: "8px",
            }}
          >
            <span style={{ fontWeight: "600", fontSize: "13px", color: "#374151" }}>Name of Accounts</span>
            <span style={{ fontWeight: "600", fontSize: "13px", color: "#374151", textAlign: "center" }}>Debit</span>
            <span style={{ fontWeight: "600", fontSize: "13px", color: "#374151", textAlign: "center" }}>Credit</span>
            <span />
          </div>

          {/* Input rows */}
          <div style={{ padding: "10px 16px" }}>
            {rows.map((row, idx) => (
              <div
                key={row.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 155px 155px 42px",
                  gap: "8px",
                  alignItems: "center",
                  marginBottom: "7px",
                }}
              >
                <TBSelect
                  value={row.account}
                  options={options}
                  placeholder="Choose"
                  onChange={(val) => updateRow(idx, "account", val)}
                />
                <AmountInput
                  value={row.debit}
                  placeholder="amount"
                  onChange={(val) => updateRow(idx, "debit", val)}
                />
                <AmountInput
                  value={row.credit}
                  placeholder="amount"
                  onChange={(val) => updateRow(idx, "credit", val)}
                />
                <button
                  aria-label="Delete row"
                  onClick={() => deleteRow(idx)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#ef4444",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "4px",
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* TOTAL row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 155px 155px 42px",
              gap: "8px",
              alignItems: "center",
              borderTop: "1px solid #e5e7eb",
              padding: "11px 16px",
              background: "#fafafa",
            }}
          >
            <span style={{ fontWeight: "700", fontSize: "13px", color: "#111827" }}>TOTAL</span>
            <span
              style={{
                fontWeight: "600",
                fontSize: "13px",
                color: "#374151",
                textAlign: "center",
              }}
            >
              {debitTotal > 0 ? `₹${debitTotal.toLocaleString("en-IN")}` : ""}
            </span>
            <span
              style={{
                fontWeight: "600",
                fontSize: "13px",
                color: "#374151",
                textAlign: "center",
              }}
            >
              {creditTotal > 0 ? `₹${creditTotal.toLocaleString("en-IN")}` : ""}
            </span>
            <span />
          </div>
        </div>

        {/* Preview button */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
          <button
            onClick={onPreview}
            style={{
              background: "#1a3a5c",
              color: "#fff",
              border: "none",
              padding: "10px 28px",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              letterSpacing: "0.01em",
            }}
          >
            Preview
          </button>
        </div>
      </main>
    </div>
  );
}

// ─── Preview Page ─────────────────────────────────────────────────────────────
function PreviewPage({
  questionTitle,
  questionNo,
  rows,
  debitTotal,
  creditTotal,
  onBack,
  onValidate,
}: {
  questionTitle: string;
  questionNo: string;
  rows: TBRow[];
  debitTotal: number;
  creditTotal: number;
  onBack: () => void;
  onValidate: () => void;
}) {
  const filledRows = rows.filter((r) => r.account || r.debit || r.credit);

  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f7", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <TBHeader questionNo={questionNo} titleLabel={questionTitle} />
      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "36px 20px 80px" }}>
        <h2
          style={{
            textAlign: "center",
            fontWeight: "700",
            fontSize: "20px",
            color: "#111827",
            marginBottom: "28px",
            letterSpacing: "-0.01em",
          }}
        >
          {questionTitle}
        </h2>

        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 1px 6px rgba(0,0,0,0.04)",
            overflow: "hidden",
            border: "1px solid #e9ecef",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fb", borderBottom: "1px solid #e5e7eb" }}>
                <th
                  style={{
                    padding: "13px 20px",
                    textAlign: "left",
                    fontWeight: "600",
                    fontSize: "13px",
                    color: "#374151",
                  }}
                >
                  Name of Accounts
                </th>
                <th
                  style={{
                    padding: "13px 20px",
                    textAlign: "right",
                    fontWeight: "600",
                    fontSize: "13px",
                    color: "#374151",
                    width: "160px",
                  }}
                >
                  Debit
                </th>
                <th
                  style={{
                    padding: "13px 20px",
                    textAlign: "right",
                    fontWeight: "600",
                    fontSize: "13px",
                    color: "#374151",
                    width: "160px",
                  }}
                >
                  Credit
                </th>
              </tr>
            </thead>
            <tbody>
              {filledRows.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "11px 20px", fontSize: "13px", color: "#374151" }}>
                    {row.account || "—"}
                  </td>
                  <td
                    style={{ padding: "11px 20px", textAlign: "right", fontSize: "13px", color: "#374151" }}
                  >
                    {row.debit ? `₹${parseFloat(row.debit).toLocaleString("en-IN")}` : ""}
                  </td>
                  <td
                    style={{ padding: "11px 20px", textAlign: "right", fontSize: "13px", color: "#374151" }}
                  >
                    {row.credit ? `₹${parseFloat(row.credit).toLocaleString("en-IN")}` : ""}
                  </td>
                </tr>
              ))}
              {/* TOTAL */}
              <tr style={{ borderTop: "2px solid #e5e7eb", background: "#fafafa" }}>
                <td
                  style={{ padding: "13px 20px", fontWeight: "700", fontSize: "13px", color: "#111827" }}
                >
                  TOTAL
                </td>
                <td
                  style={{
                    padding: "13px 20px",
                    textAlign: "right",
                    fontWeight: "600",
                    fontSize: "13px",
                    color: "#111827",
                  }}
                >
                  {debitTotal > 0 ? `₹${debitTotal.toLocaleString("en-IN")}` : ""}
                </td>
                <td
                  style={{
                    padding: "13px 20px",
                    textAlign: "right",
                    fontWeight: "600",
                    fontSize: "13px",
                    color: "#111827",
                  }}
                >
                  {creditTotal > 0 ? `₹${creditTotal.toLocaleString("en-IN")}` : ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              color: "#374151",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontWeight: "500",
            }}
          >
            ← Back
          </button>
          <button
            onClick={onValidate}
            style={{
              background: "#1a3a5c",
              color: "#fff",
              border: "none",
              padding: "10px 28px",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Validate
          </button>
        </div>
      </main>
    </div>
  );
}

// ─── Custom Select ────────────────────────────────────────────────────────────
function TBSelect({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: string;
  options: string[];
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          height: "36px",
          padding: "0 30px 0 10px",
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          background: "#fff",
          fontSize: "13px",
          color: value ? "#111827" : "#9ca3af",
          appearance: "none",
          cursor: "pointer",
          outline: "none",
        }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        style={{
          position: "absolute",
          right: "8px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "#6b7280",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ─── Amount Input ─────────────────────────────────────────────────────────────
function AmountInput({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        background: "#fff",
        height: "36px",
        overflow: "hidden",
      }}
    >
      <input
        type="text"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          padding: "0 8px",
          fontSize: "13px",
          color: "#111827",
          background: "transparent",
          width: "100%",
          textAlign: "right",
        }}
      />
      <span
        style={{
          padding: "0 8px",
          color: "#6b7280",
          fontSize: "13px",
          borderLeft: "1px solid #e5e7eb",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "#f9fafb",
        }}
      >
        ₹
      </span>
    </div>
  );
}

// ─── Utility screens ──────────────────────────────────────────────────────────
function LoadingScreen() {
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

function ErrorScreen({ message }: { message: string }) {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <AlertCircle size={48} color="#ef4444" />
      <h2 style={{ color: "#111827" }}>Error</h2>
      <p style={{ color: "#6b7280", maxWidth: "400px" }}>{message}</p>
    </div>
  );
}
