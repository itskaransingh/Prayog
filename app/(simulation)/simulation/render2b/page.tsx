"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { saveSimulationAttempt } from "@/lib/simulation/attempts";
import { PrayogLogo } from "@/components/branding/prayog-logo";
import { DraggableCalculator } from "@/components/simulation/shared/draggable-calculator";
import { EvaluationPopup } from "@/components/simulation/income-tax/shared/evaluation-results";
import {
  buildFSAttemptAnswers,
  buildFSEvaluationResult,
  getFSOptions,
  type FSFieldRecord,
  type FSRow,
  type FSEntries,
} from "@/lib/simulation/fs-field-mapper";
import { Loader2, AlertCircle, Trash2, ChevronDown } from "lucide-react";

// ─── Section key type ─────────────────────────────────────────────────────────
type SectionKey =
  | "directExpense"
  | "directIncome"
  | "indirectExpense"
  | "indirectIncome"
  | "capital"
  | "ncl"
  | "cl"
  | "ppe"
  | "onca"
  | "ca";

type AllRows = Record<SectionKey, FSRow[]>;

const INITIAL_ROWS: AllRows = {
  directExpense: [{ id: 1, account: "", amount: "" }],
  directIncome: [{ id: 2, account: "", amount: "" }],
  indirectExpense: [{ id: 3, account: "", amount: "" }],
  indirectIncome: [{ id: 4, account: "", amount: "" }],
  capital: [{ id: 5, account: "", amount: "" }],
  ncl: [{ id: 6, account: "", amount: "" }],
  cl: [{ id: 7, account: "", amount: "" }],
  ppe: [{ id: 8, account: "", amount: "" }],
  onca: [{ id: 9, account: "", amount: "" }],
  ca: [{ id: 10, account: "", amount: "" }],
};

// Map section key → DB field prefix
const SECTION_PREFIX: Record<SectionKey, string> = {
  directExpense: "pl_direct_expense",
  directIncome: "pl_direct_income",
  indirectExpense: "pl_indirect_expense",
  indirectIncome: "pl_indirect_income",
  capital: "bs_capital",
  ncl: "bs_ncl",
  cl: "bs_cl",
  ppe: "bs_ppe",
  onca: "bs_onca",
  ca: "bs_ca",
};

// ─── Wrapper ──────────────────────────────────────────────────────────────────
export default function FinancialStatementPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <FinancialStatementContent />
    </Suspense>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────
function FinancialStatementContent() {
  const supabase = createClient();
  const params = useSearchParams();
  const questionId = params.get("questionId");

  const [loading, setLoading] = useState(true);
  const [questionNo, setQuestionNo] = useState("FS_000");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [fields, setFields] = useState<FSFieldRecord[]>([]);
  const [allRows, setAllRows] = useState<AllRows>(INITIAL_ROWS);
  const [nextId, setNextId] = useState(11);
  const [showPreview, setShowPreview] = useState(false);
  const [evaluation, setEvaluation] = useState<ReturnType<typeof buildFSEvaluationResult> | null>(null);
  const [showEval, setShowEval] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [startTime] = useState(Date.now());

  // ─── Data fetch ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        if (!questionId) { setLoading(false); return; }

        const { data: q } = await supabase
          .from("questions").select("*").eq("id", questionId).single();

        if (q) {
          setQuestionNo(
            q.table_data?.question_no ?? `FS_${q.id.slice(-5).toUpperCase()}`
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
        console.error("FS load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [questionId, supabase]);

  // ─── Options per section ──────────────────────────────────────────────────
  const sectionOptions = useMemo(() => {
    const result: Record<SectionKey, string[]> = {} as Record<SectionKey, string[]>;
    for (const [key, prefix] of Object.entries(SECTION_PREFIX) as [SectionKey, string][]) {
      result[key] = getFSOptions(fields, prefix);
    }
    // If a section has no specific options, fall back to all account options
    const allOpts = Array.from(
      new Set(
        fields
          .filter((f) => f.field_name?.endsWith("account"))
          .flatMap((f) => (Array.isArray(f.options) ? f.options : []))
      )
    );
    for (const key of Object.keys(result) as SectionKey[]) {
      if (result[key].length === 0) result[key] = allOpts;
    }
    return result;
  }, [fields]);

  // ─── Totals ───────────────────────────────────────────────────────────────
  const totalOf = (rows: FSRow[]) =>
    rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

  const totals = useMemo(
    () => ({
      directExpense: totalOf(allRows.directExpense),
      directIncome: totalOf(allRows.directIncome),
      indirectExpense: totalOf(allRows.indirectExpense),
      indirectIncome: totalOf(allRows.indirectIncome),
      capital: totalOf(allRows.capital),
      ncl: totalOf(allRows.ncl),
      cl: totalOf(allRows.cl),
      ppe: totalOf(allRows.ppe),
      onca: totalOf(allRows.onca),
      ca: totalOf(allRows.ca),
    }),
    [allRows]
  );

  const grossProfit = totals.directIncome - totals.directExpense;
  const netResult =
    grossProfit + totals.indirectIncome - totals.indirectExpense;

  // ─── Row actions ──────────────────────────────────────────────────────────
  function updateFSRow(section: SectionKey, idx: number, key: "account" | "amount", val: string) {
    setAllRows((prev) => {
      const rows = [...prev[section]];
      rows[idx] = { ...rows[idx], [key]: val };
      if (key === "account" && val !== "" && idx === rows.length - 1) {
        const id = nextId;
        setNextId((n) => n + 1);
        return { ...prev, [section]: [...rows, { id, account: "", amount: "" }] };
      }
      return { ...prev, [section]: rows };
    });
  }

  function deleteFSRow(section: SectionKey, idx: number) {
    setAllRows((prev) => {
      const rows = prev[section];
      if (rows.length === 1) return { ...prev, [section]: [{ ...rows[0], account: "", amount: "" }] };
      return { ...prev, [section]: rows.filter((_, i) => i !== idx) };
    });
  }

  // ─── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!taskId || !questionId) {
      alert("Task ID or Question ID is missing.");
      return;
    }
    if (fields.length === 0) {
      const message = "Simulation fields are not available for this financial statement question.";
      setSubmitError(message);
      alert(message);
      return;
    }
    const endTime = Date.now();
    const entries: FSEntries = {
      directExpense: allRows.directExpense,
      directIncome: allRows.directIncome,
      indirectExpense: allRows.indirectExpense,
      indirectIncome: allRows.indirectIncome,
      capital: allRows.capital,
      ncl: allRows.ncl,
      cl: allRows.cl,
      ppe: allRows.ppe,
      onca: allRows.onca,
      ca: allRows.ca,
    };

    const answers = buildFSAttemptAnswers(fields, entries);
    const evalResult = buildFSEvaluationResult(fields, entries, startTime, endTime);
    setEvaluation(evalResult);
    setShowEval(true);
    setSubmitError(null);

    if (answers.length === 0) {
      const message =
        "No simulation answers could be mapped from the loaded financial statement fields. Check the field naming pattern in simulation_fields.";
      setSubmitError(message);
      console.error("FS submit mapping error", {
        questionId,
        taskId,
        fieldNames: fields.map((field) => field.field_name),
      });
      alert(message);
      return;
    }

    try {
      await saveSimulationAttempt({ questionId, taskId, startTime, endTime, answers });
    } catch (e) {
      console.error("Save error:", e);
      setSubmitError(e instanceof Error ? e.message : "Failed to save financial statement attempt.");
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;
  if (!questionId) return <ErrorScreen message="No questionId found in URL." />;

  return (
    <>
      {showPreview ? (
        <PreviewPage
          questionNo={questionNo}
          allRows={allRows}
          totals={totals}
          grossProfit={grossProfit}
          netResult={netResult}
          onBack={() => setShowPreview(false)}
          onValidate={handleSubmit}
        />
      ) : (
        <EditorPage
          questionNo={questionNo}
          allRows={allRows}
          sectionOptions={sectionOptions}
          submitError={submitError}
          updateFSRow={updateFSRow}
          deleteFSRow={deleteFSRow}
          onPreview={() => setShowPreview(true)}
        />
      )}
      <EvaluationPopup
        open={showEval}
        onClose={() => setShowEval(false)}
        results={evaluation}
        variant="fs"
      />
      <DraggableCalculator />
    </>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function FSHeader({ questionNo }: { questionNo: string }) {
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
            Financial Statement
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

// ─────────────────────────────────────────────────────────────────────────────
// EDITOR PAGE
// ─────────────────────────────────────────────────────────────────────────────
function EditorPage({
  questionNo,
  allRows,
  sectionOptions,
  submitError,
  updateFSRow,
  deleteFSRow,
  onPreview,
}: {
  questionNo: string;
  allRows: AllRows;
  sectionOptions: Record<SectionKey, string[]>;
  submitError: string | null;
  updateFSRow: (section: SectionKey, idx: number, key: "account" | "amount", val: string) => void;
  deleteFSRow: (section: SectionKey, idx: number) => void;
  onPreview: () => void;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f7", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <FSHeader questionNo={questionNo} />
      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 20px 80px" }}>
        {submitError ? (
          <div
            style={{
              marginBottom: "20px",
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#991b1b",
              borderRadius: "10px",
              padding: "12px 14px",
              fontSize: "14px",
            }}
          >
            {submitError}
          </div>
        ) : null}

        {/* ── P&L Section ─────────────────────────────────────────────────── */}
        <h2 style={{ textAlign: "center", fontWeight: "700", fontSize: "19px", color: "#111827", marginBottom: "20px" }}>
          Trading and Profit and Loss Account for the year ended .....
        </h2>

        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e9ecef", overflow: "hidden", marginBottom: "32px" }}>
          {/* P&L table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ padding: "11px 16px", fontWeight: "600", fontSize: "13px", color: "#374151", borderRight: "1px solid #e5e7eb" }}>Particulars</div>
            <div style={{ padding: "11px 16px", fontWeight: "600", fontSize: "13px", color: "#374151" }}>Particulars</div>
          </div>

          {/* Direct Expenses / Direct Income row */}
          <PLSectionPair
            leftLabel="Direct Expenses"
            rightLabel="Direct Income"
            leftRows={allRows.directExpense}
            rightRows={allRows.directIncome}
            leftOptions={sectionOptions.directExpense}
            rightOptions={sectionOptions.directIncome}
            onUpdateLeft={(idx, key, val) => updateFSRow("directExpense", idx, key, val)}
            onUpdateRight={(idx, key, val) => updateFSRow("directIncome", idx, key, val)}
            onDeleteLeft={(idx) => deleteFSRow("directExpense", idx)}
            onDeleteRight={(idx) => deleteFSRow("directIncome", idx)}
          />

          {/* Divider */}
          <div style={{ borderTop: "1px solid #e5e7eb" }} />

          {/* Indirect Expenses / Indirect Income row */}
          <PLSectionPair
            leftLabel="Indirect Expenses"
            rightLabel="Indirect Income"
            leftRows={allRows.indirectExpense}
            rightRows={allRows.indirectIncome}
            leftOptions={sectionOptions.indirectExpense}
            rightOptions={sectionOptions.indirectIncome}
            onUpdateLeft={(idx, key, val) => updateFSRow("indirectExpense", idx, key, val)}
            onUpdateRight={(idx, key, val) => updateFSRow("indirectIncome", idx, key, val)}
            onDeleteLeft={(idx) => deleteFSRow("indirectExpense", idx)}
            onDeleteRight={(idx) => deleteFSRow("indirectIncome", idx)}
          />
        </div>

        {/* ── Balance Sheet Section ────────────────────────────────────────── */}
        <h2 style={{ textAlign: "center", fontWeight: "700", fontSize: "19px", color: "#111827", marginBottom: "20px" }}>
          Balance sheet as at.......
        </h2>

        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e9ecef", overflow: "hidden", marginBottom: "32px" }}>
          {/* BS table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid #e5e7eb" }}>
            <div style={{ padding: "11px 16px", fontWeight: "600", fontSize: "13px", color: "#374151", borderRight: "1px solid #e5e7eb" }}>Liabilities</div>
            <div style={{ padding: "11px 16px", fontWeight: "600", fontSize: "13px", color: "#374151" }}>Assets</div>
          </div>

          {/* Capital Account / PPE */}
          <BSSectionPair
            leftLabel="Capital Account"
            rightLabel="Property, Plant and Equipment"
            leftRows={allRows.capital}
            rightRows={allRows.ppe}
            leftOptions={sectionOptions.capital}
            rightOptions={sectionOptions.ppe}
            onUpdateLeft={(idx, key, val) => updateFSRow("capital", idx, key, val)}
            onUpdateRight={(idx, key, val) => updateFSRow("ppe", idx, key, val)}
            onDeleteLeft={(idx) => deleteFSRow("capital", idx)}
            onDeleteRight={(idx) => deleteFSRow("ppe", idx)}
          />

          <div style={{ borderTop: "1px solid #e5e7eb" }} />

          {/* NCL / ONCA */}
          <BSSectionPair
            leftLabel="Non-Current Liabilities"
            rightLabel="Other Non-Current Assets"
            leftRows={allRows.ncl}
            rightRows={allRows.onca}
            leftOptions={sectionOptions.ncl}
            rightOptions={sectionOptions.onca}
            onUpdateLeft={(idx, key, val) => updateFSRow("ncl", idx, key, val)}
            onUpdateRight={(idx, key, val) => updateFSRow("onca", idx, key, val)}
            onDeleteLeft={(idx) => deleteFSRow("ncl", idx)}
            onDeleteRight={(idx) => deleteFSRow("onca", idx)}
          />

          <div style={{ borderTop: "1px solid #e5e7eb" }} />

          {/* CL / CA */}
          <BSSectionPair
            leftLabel="Current Liabilities"
            rightLabel="Current Assets"
            leftRows={allRows.cl}
            rightRows={allRows.ca}
            leftOptions={sectionOptions.cl}
            rightOptions={sectionOptions.ca}
            onUpdateLeft={(idx, key, val) => updateFSRow("cl", idx, key, val)}
            onUpdateRight={(idx, key, val) => updateFSRow("ca", idx, key, val)}
            onDeleteLeft={(idx) => deleteFSRow("cl", idx)}
            onDeleteRight={(idx) => deleteFSRow("ca", idx)}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
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
            }}
          >
            Preview
          </button>
        </div>
      </main>
    </div>
  );
}

// ─── P&L Section Pair (side-by-side in editor) ───────────────────────────────
function PLSectionPair({
  leftLabel,
  rightLabel,
  leftRows,
  rightRows,
  leftOptions,
  rightOptions,
  onUpdateLeft,
  onUpdateRight,
  onDeleteLeft,
  onDeleteRight,
}: {
  leftLabel: string;
  rightLabel: string;
  leftRows: FSRow[];
  rightRows: FSRow[];
  leftOptions: string[];
  rightOptions: string[];
  onUpdateLeft: (idx: number, key: "account" | "amount", val: string) => void;
  onUpdateRight: (idx: number, key: "account" | "amount", val: string) => void;
  onDeleteLeft: (idx: number) => void;
  onDeleteRight: (idx: number) => void;
}) {
  const rowCount = Math.max(leftRows.length, rightRows.length);

  return (
    <div>
      {/* Section header row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        <div
          style={{
            padding: "9px 16px",
            fontWeight: "600",
            fontSize: "13px",
            color: "#374151",
            background: "#f8f9fb",
            borderRight: "1px solid #e5e7eb",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          {leftLabel}
        </div>
        <div
          style={{
            padding: "9px 16px",
            fontWeight: "600",
            fontSize: "13px",
            color: "#374151",
            background: "#f8f9fb",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          {rightLabel}
        </div>
      </div>

      {/* Input rows */}
      {Array.from({ length: rowCount }).map((_, idx) => (
        <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          {/* Left cell */}
          <div
            style={{
              padding: "8px 16px",
              borderRight: "1px solid #e5e7eb",
              borderBottom: idx < rowCount - 1 ? "1px solid #f3f4f6" : undefined,
            }}
          >
            {idx < leftRows.length ? (
              <FSInputRow
                row={leftRows[idx]}
                options={leftOptions}
                onUpdate={(key, val) => onUpdateLeft(idx, key, val)}
                onDelete={() => onDeleteLeft(idx)}
              />
            ) : (
              <div style={{ height: "36px" }} />
            )}
          </div>
          {/* Right cell */}
          <div
            style={{
              padding: "8px 16px",
              borderBottom: idx < rowCount - 1 ? "1px solid #f3f4f6" : undefined,
            }}
          >
            {idx < rightRows.length ? (
              <FSInputRow
                row={rightRows[idx]}
                options={rightOptions}
                onUpdate={(key, val) => onUpdateRight(idx, key, val)}
                onDelete={() => onDeleteRight(idx)}
              />
            ) : (
              <div style={{ height: "36px" }} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── BS Section Pair ──────────────────────────────────────────────────────────
const BSSectionPair = PLSectionPair;

// ─── Single input row (account select + amount input + delete) ────────────────
function FSInputRow({
  row,
  options,
  onUpdate,
  onDelete,
}: {
  row: FSRow;
  options: string[];
  onUpdate: (key: "account" | "amount", val: string) => void;
  onDelete: () => void;
}) {
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <div style={{ flex: "1 1 0", minWidth: 0 }}>
        <FSSelect
          value={row.account}
          options={options}
          onChange={(val) => onUpdate("account", val)}
        />
      </div>
      <div style={{ width: "120px", flexShrink: 0 }}>
        <FSAmountInput
          value={row.amount}
          onChange={(val) => onUpdate("amount", val)}
        />
      </div>
      <button
        aria-label="Delete"
        onClick={onDelete}
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
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW PAGE
// ─────────────────────────────────────────────────────────────────────────────
function PreviewPage({
  questionNo,
  allRows,
  totals,
  grossProfit,
  netResult,
  onBack,
  onValidate,
}: {
  questionNo: string;
  allRows: AllRows;
  totals: Record<SectionKey, number>;
  grossProfit: number;
  netResult: number;
  onBack: () => void;
  onValidate: () => void;
}) {
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  // Totals for upper section (Direct)
  const upperTotal = Math.max(
    totals.directExpense + Math.max(grossProfit, 0),
    totals.directIncome + Math.max(-grossProfit, 0)
  );

  // Totals for lower section (Indirect)
  const lowerRightTotal = Math.abs(grossProfit) + totals.indirectIncome + Math.max(-netResult, 0);
  const lowerLeftTotal = totals.indirectExpense + Math.max(netResult, 0);
  const lowerTotal = Math.max(lowerRightTotal, lowerLeftTotal);

  // BS totals
  const liabilitiesTotal = totals.capital + totals.ncl + totals.cl;
  const assetsTotal = totals.ppe + totals.onca + totals.ca;

  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f7", fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      <FSHeader questionNo={questionNo} />
      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 20px 80px" }}>

        {/* ── P&L Preview ───────────────────────────────────────────────────── */}
        <h2 style={{ textAlign: "center", fontWeight: "700", fontSize: "19px", color: "#111827", marginBottom: "20px" }}>
          Trading and Profit and Loss Account for the year ended......
        </h2>

        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e9ecef", overflow: "hidden", marginBottom: "32px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={thStyle}>Particulars</th>
                <th style={{ ...thStyle, width: "130px", textAlign: "right" }}>Amount</th>
                <th style={{ ...thStyle, borderLeft: "1px solid #e5e7eb" }}>Particulars</th>
                <th style={{ ...thStyle, width: "130px", textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* ── Upper section: Direct ── */}
              {/* Left: Direct Expenses header */}
              <tr>
                <td colSpan={2} style={{ ...sectionHeaderTd, borderRight: "1px solid #e5e7eb" }}>
                  Direct Expenses
                </td>
                <td colSpan={2} style={sectionHeaderTd}>
                  Direct Income
                </td>
              </tr>

              {/* Paired rows: expenses on left, income on right */}
              {renderPairedRows(allRows.directExpense, allRows.directIncome)}

              {/* Gross Profit C/d on left (if profit) or Gross Loss C/d on right (if loss) */}
              {grossProfit >= 0 ? (
                <tr style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={tdLabel}><strong>Gross profit C/d</strong></td>
                  <td style={tdAmount}><strong>{fmt(grossProfit)}</strong></td>
                  <td style={{ ...tdLabel, borderLeft: "1px solid #e5e7eb" }} />
                  <td style={tdAmount} />
                </tr>
              ) : (
                <tr style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={tdLabel} />
                  <td style={tdAmount} />
                  <td style={{ ...tdLabel, borderLeft: "1px solid #e5e7eb" }}>
                    <strong>Gross loss C/d</strong>
                  </td>
                  <td style={tdAmount}><strong>{fmt(Math.abs(grossProfit))}</strong></td>
                </tr>
              )}

              {/* Upper Total row */}
              <tr style={{ borderTop: "2px solid #e5e7eb", background: "#fafafa" }}>
                <td style={{ ...tdLabel, fontWeight: "700" }}>Total</td>
                <td style={{ ...tdAmount, fontWeight: "700" }}>{upperTotal > 0 ? fmt(upperTotal) : ""}</td>
                <td style={{ ...tdLabel, borderLeft: "1px solid #e5e7eb", fontWeight: "700" }}>Total</td>
                <td style={{ ...tdAmount, fontWeight: "700" }}>{upperTotal > 0 ? fmt(upperTotal) : ""}</td>
              </tr>

              {/* ── Lower section: Indirect ── */}
              {/* Right side: Gross Profit B/d */}
              <tr style={{ borderTop: "1px solid #e5e7eb" }}>
                <td colSpan={2} style={{ ...sectionHeaderTd, borderRight: "1px solid #e5e7eb" }}>
                  Indirect Expenses
                </td>
                <td colSpan={2} style={sectionHeaderTd}>
                  Indirect Income
                </td>
              </tr>

              {/* Gross Profit B/d on right */}
              <tr>
                <td style={tdLabel} />
                <td style={tdAmount} />
                <td style={{ ...tdLabel, borderLeft: "1px solid #e5e7eb" }}>
                  <strong>Gross Profit B/d</strong>
                </td>
                <td style={tdAmount}><strong>{fmt(Math.abs(grossProfit))}</strong></td>
              </tr>

              {/* Paired rows: indirect expenses left, indirect income right */}
              {renderPairedRows(allRows.indirectExpense, allRows.indirectIncome)}

              {/* Net Profit/Loss */}
              {netResult >= 0 ? (
                <tr style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={tdLabel}><strong>Net Profit C/f to Balance Sheet</strong></td>
                  <td style={tdAmount}><strong>{fmt(netResult)}</strong></td>
                  <td style={{ ...tdLabel, borderLeft: "1px solid #e5e7eb" }} />
                  <td style={tdAmount} />
                </tr>
              ) : (
                <tr style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={tdLabel} />
                  <td style={tdAmount} />
                  <td style={{ ...tdLabel, borderLeft: "1px solid #e5e7eb" }}>
                    <strong>Net loss C/f to Balance Sheet</strong>
                  </td>
                  <td style={tdAmount}><strong>{fmt(Math.abs(netResult))}</strong></td>
                </tr>
              )}

              {/* Lower Total */}
              <tr style={{ borderTop: "2px solid #e5e7eb", background: "#fafafa" }}>
                <td style={{ ...tdLabel, fontWeight: "700" }}>Total</td>
                <td style={{ ...tdAmount, fontWeight: "700" }}>{lowerTotal > 0 ? fmt(lowerTotal) : ""}</td>
                <td style={{ ...tdLabel, borderLeft: "1px solid #e5e7eb", fontWeight: "700" }}>Total</td>
                <td style={{ ...tdAmount, fontWeight: "700" }}>{lowerTotal > 0 ? fmt(lowerTotal) : ""}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Balance Sheet Preview ─────────────────────────────────────────── */}
        <h2 style={{ textAlign: "center", fontWeight: "700", fontSize: "19px", color: "#111827", marginBottom: "20px" }}>
          Balance Sheet as at.....
        </h2>

        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e9ecef", overflow: "hidden", marginBottom: "32px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8f9fb", borderBottom: "1px solid #e5e7eb" }}>
                <th style={thStyle}>Liabilities</th>
                <th style={{ ...thStyle, width: "110px", textAlign: "right" }}>Amount</th>
                <th style={{ ...thStyle, width: "110px", textAlign: "right" }}>Amount</th>
                <th style={{ ...thStyle, borderLeft: "1px solid #e5e7eb" }}>Assets</th>
                <th style={{ ...thStyle, width: "110px", textAlign: "right" }}>Amount</th>
                <th style={{ ...thStyle, width: "110px", textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* Capital Account / PPE */}
              <BSSectionPreviewPair
                leftLabel="Capital Account"
                rightLabel="Property, Plant and Equipment"
                leftRows={allRows.capital}
                rightRows={allRows.ppe}
                leftTotal={totals.capital}
                rightTotal={totals.ppe}
              />

              {/* NCL / ONCA */}
              <BSSectionPreviewPair
                leftLabel="Non-Current Liabilities"
                rightLabel="Other Non-Current Assets"
                leftRows={allRows.ncl}
                rightRows={allRows.onca}
                leftTotal={totals.ncl}
                rightTotal={totals.onca}
              />

              {/* CL / CA */}
              <BSSectionPreviewPair
                leftLabel="Current Liabilities"
                rightLabel="Current Assets"
                leftRows={allRows.cl}
                rightRows={allRows.ca}
                leftTotal={totals.cl}
                rightTotal={totals.ca}
              />

              {/* Grand Total */}
              <tr style={{ borderTop: "2px solid #e5e7eb", background: "#fafafa" }}>
                <td style={{ ...tdLabel, fontWeight: "700" }}>Total</td>
                <td style={{ ...tdAmount, fontWeight: "700" }} />
                <td style={{ ...tdAmount, fontWeight: "700" }}>
                  {liabilitiesTotal > 0 ? fmt(liabilitiesTotal) : ""}
                </td>
                <td style={{ ...tdLabel, borderLeft: "1px solid #e5e7eb", fontWeight: "700" }}>Total</td>
                <td style={{ ...tdAmount, fontWeight: "700" }} />
                <td style={{ ...tdAmount, fontWeight: "700" }}>
                  {assetsTotal > 0 ? fmt(assetsTotal) : ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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

// ─── Balance Sheet section preview rows ───────────────────────────────────────
function BSSectionPreviewPair({
  leftLabel,
  rightLabel,
  leftRows,
  rightRows,
  leftTotal,
  rightTotal,
}: {
  leftLabel: string;
  rightLabel: string;
  leftRows: FSRow[];
  rightRows: FSRow[];
  leftTotal: number;
  rightTotal: number;
}) {
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const filledLeft = leftRows.filter((r) => r.account || r.amount);
  const filledRight = rightRows.filter((r) => r.account || r.amount);
  const rowCount = Math.max(filledLeft.length, filledRight.length, 1);

  return (
    <>
      {/* Section header */}
      <tr style={{ borderTop: "1px solid #e5e7eb" }}>
        <td colSpan={3} style={{ ...sectionHeaderTd, borderRight: "1px solid #e5e7eb" }}>
          {leftLabel}
        </td>
        <td colSpan={3} style={sectionHeaderTd}>
          {rightLabel}
        </td>
      </tr>

      {/* Item rows */}
      {Array.from({ length: rowCount }).map((_, idx) => {
        const lRow = filledLeft[idx];
        const rRow = filledRight[idx];
        return (
          <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
            <td style={tdLabel}>{lRow?.account || ""}</td>
            <td style={tdAmount}>
              {lRow?.amount ? fmt(parseFloat(lRow.amount) || 0) : ""}
            </td>
            <td style={tdAmount} />
            <td style={{ ...tdLabel, borderLeft: "1px solid #e5e7eb" }}>{rRow?.account || ""}</td>
            <td style={tdAmount}>
              {rRow?.amount ? fmt(parseFloat(rRow.amount) || 0) : ""}
            </td>
            <td style={tdAmount} />
          </tr>
        );
      })}

      {/* Section total */}
      <tr style={{ background: "#fafafa" }}>
        <td style={tdLabel} />
        <td style={tdAmount} />
        <td style={{ ...tdAmount, fontWeight: "600" }}>
          {leftTotal > 0 ? fmt(leftTotal) : ""}
        </td>
        <td style={{ ...tdLabel, borderLeft: "1px solid #e5e7eb" }} />
        <td style={tdAmount} />
        <td style={{ ...tdAmount, fontWeight: "600" }}>
          {rightTotal > 0 ? fmt(rightTotal) : ""}
        </td>
      </tr>
    </>
  );
}

// ─── Helper: paired rows for P&L table ───────────────────────────────────────
function renderPairedRows(leftRows: FSRow[], rightRows: FSRow[]) {
  const filledLeft = leftRows.filter((r) => r.account || r.amount);
  const filledRight = rightRows.filter((r) => r.account || r.amount);
  const count = Math.max(filledLeft.length, filledRight.length);
  if (count === 0) return null;

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return Array.from({ length: count }).map((_, idx) => {
    const lRow = filledLeft[idx];
    const rRow = filledRight[idx];
    return (
      <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
        <td style={tdLabel}>{lRow?.account || ""}</td>
        <td style={tdAmount}>{lRow?.amount ? fmt(parseFloat(lRow.amount) || 0) : ""}</td>
        <td style={{ ...tdLabel, borderLeft: "1px solid #e5e7eb" }}>{rRow?.account || ""}</td>
        <td style={tdAmount}>{rRow?.amount ? fmt(parseFloat(rRow.amount) || 0) : ""}</td>
      </tr>
    );
  });
}

// ─── Shared table styles ──────────────────────────────────────────────────────
const thStyle: React.CSSProperties = {
  padding: "11px 16px",
  textAlign: "left",
  fontWeight: "600",
  fontSize: "13px",
  color: "#374151",
};

const sectionHeaderTd: React.CSSProperties = {
  padding: "9px 16px",
  fontWeight: "600",
  fontSize: "13px",
  color: "#374151",
  background: "#f8f9fb",
  borderBottom: "1px solid #e5e7eb",
};

const tdLabel: React.CSSProperties = {
  padding: "10px 16px",
  fontSize: "13px",
  color: "#374151",
};

const tdAmount: React.CSSProperties = {
  padding: "10px 16px",
  fontSize: "13px",
  color: "#374151",
  textAlign: "right",
};

// ─── FS Select ─────────────────────────────────────────────────────────────────
function FSSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          height: "34px",
          padding: "0 28px 0 9px",
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          background: "#fff",
          fontSize: "12px",
          color: value ? "#111827" : "#9ca3af",
          appearance: "none",
          cursor: "pointer",
          outline: "none",
        }}
      >
        <option value="" disabled>Choose</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown
        size={12}
        style={{
          position: "absolute",
          right: "7px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "#6b7280",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ─── FS Amount Input ──────────────────────────────────────────────────────────
function FSAmountInput({
  value,
  onChange,
}: {
  value: string;
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
        height: "34px",
        overflow: "hidden",
      }}
    >
      <input
        type="text"
        inputMode="decimal"
        value={value}
        placeholder=""
        onChange={(e) => onChange(e.target.value)}
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          padding: "0 6px",
          fontSize: "12px",
          color: "#111827",
          background: "transparent",
          width: "100%",
          textAlign: "right",
        }}
      />
      <span
        style={{
          padding: "0 6px",
          color: "#6b7280",
          fontSize: "12px",
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

// ─── Utility screens ───────────────────────────────────────────────────────────
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
