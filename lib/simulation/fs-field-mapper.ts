/**
 * Financial Statement Field Mapper
 *
 * Field naming convention in the database:
 *   P&L:
 *     pl_direct_expense_row{N}_account / amount
 *     pl_direct_income_row{N}_account / amount
 *     pl_indirect_expense_row{N}_account / amount
 *     pl_indirect_income_row{N}_account / amount
 *   Balance Sheet:
 *     bs_capital_row{N}_account / amount
 *     bs_ncl_row{N}_account / amount          (Non-Current Liabilities)
 *     bs_cl_row{N}_account / amount           (Current Liabilities)
 *     bs_ppe_row{N}_account / amount          (Property, Plant & Equipment)
 *     bs_onca_row{N}_account / amount         (Other Non-Current Assets)
 *     bs_ca_row{N}_account / amount           (Current Assets)
 */

import type { EvaluationResult } from "@/lib/evaluation";
import type { SimulationAttemptAnswerInput } from "@/lib/simulation/attempts";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface FSFieldRecord {
  id: string;
  field_name: string | null;
  field_label: string | null;
  expected_value: string | null;
  options?: string[] | null;
}

export interface FSRow {
  id: number;
  account: string;
  amount: string;
}

export interface FSSectionResult {
  section: string;
  totalScore: number;
  maxScore: number;
  accuracy: number;
}

export interface FSEvaluationResult extends EvaluationResult {
  sectionBreakdown?: FSSectionResult[];
}

export type FSSectionKey =
  | "pl_direct_expense"
  | "pl_direct_income"
  | "pl_indirect_expense"
  | "pl_indirect_income"
  | "bs_capital"
  | "bs_ncl"
  | "bs_cl"
  | "bs_ppe"
  | "bs_onca"
  | "bs_ca";

export interface FSEntries {
  directExpense: FSRow[];
  directIncome: FSRow[];
  indirectExpense: FSRow[];
  indirectIncome: FSRow[];
  capital: FSRow[];
  ncl: FSRow[];
  cl: FSRow[];
  ppe: FSRow[];
  onca: FSRow[];
  ca: FSRow[];
}

// ─── Pattern ──────────────────────────────────────────────────────────────────
const FS_FIELD_PATTERN = /^(pl|bs)_([\w]+)_row(\d+)_(account|amount)$/i;

function normalizeValue(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizeAmountInput(value: string | null | undefined): string {
  return (value ?? "").trim().replaceAll(",", "");
}

function getSectionLabel(sectionKey: string): string {
  return sectionKey
    .replace("pl_", "")
    .replace("bs_", "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function scoreAccount(entered: string, expected: string): number {
  const enteredNorm = normalizeValue(entered);
  const expectedNorm = normalizeValue(expected);

  if (enteredNorm === expectedNorm) {
    return 1;
  }

  if (!enteredNorm || !expectedNorm) {
    return 0;
  }

  const enteredContainsExpected = enteredNorm.includes(expectedNorm);
  const expectedContainsEntered = expectedNorm.includes(enteredNorm);
  const shorterLength = Math.min(enteredNorm.length, expectedNorm.length);
  const expectedThreshold = expectedNorm.length * 0.6;

  if ((enteredContainsExpected || expectedContainsEntered) && shorterLength >= expectedThreshold) {
    return 0.5;
  }

  return 0;
}

function scoreAmount(entered: string, expected: string): number {
  const enteredAmount = parseFloat(entered.replaceAll(",", "").trim()) || 0;
  const expectedAmount = parseFloat(expected.replaceAll(",", "").trim()) || 0;

  return Math.abs(enteredAmount - expectedAmount) <= 1 ? 1 : 0;
}

function scoreRow(enteredAccount: string, expectedAccount: string, enteredAmount: string, expectedAmount: string) {
  const accountScore = scoreAccount(enteredAccount, expectedAccount);
  const amountScore = scoreAmount(enteredAmount, expectedAmount);
  const totalScore = (accountScore + amountScore) / 2;

  return {
    accountScore,
    amountScore,
    totalScore,
    status:
      totalScore === 1
        ? "correct"
        : totalScore > 0
          ? "partial"
          : "incorrect",
  } as const;
}

// ─── Parsing helpers ──────────────────────────────────────────────────────────
export function parseFSFields(fields: FSFieldRecord[]): Map<string, FSFieldRecord[]> {
  const grouped = new Map<string, FSFieldRecord[]>();
  for (const field of fields) {
    const name = field.field_name ?? "";
    const match = name.match(FS_FIELD_PATTERN);
    if (!match) continue;
    const sectionKey = `${match[1]}_${match[2]}`; // e.g. "pl_direct_expense"
    const list = grouped.get(sectionKey) ?? [];
    list.push(field);
    grouped.set(sectionKey, list);
  }
  return grouped;
}

export function getFSOptions(fields: FSFieldRecord[], sectionKey: string): string[] {
  const opts = fields
    .filter(
      (f) =>
        f.field_name?.startsWith(sectionKey) &&
        f.field_name?.endsWith("account")
    )
    .flatMap((f) => (Array.isArray(f.options) ? f.options : []));
  return Array.from(new Set(opts));
}

// ─── Attempt answers builder ──────────────────────────────────────────────────
export function buildFSAttemptAnswers(
  fields: FSFieldRecord[],
  entries: FSEntries
): SimulationAttemptAnswerInput[] {
  const answers: SimulationAttemptAnswerInput[] = [];
  const grouped = parseFSFields(fields);

  const sectionMap: Record<string, FSRow[]> = {
    pl_direct_expense: entries.directExpense,
    pl_direct_income: entries.directIncome,
    pl_indirect_expense: entries.indirectExpense,
    pl_indirect_income: entries.indirectIncome,
    bs_capital: entries.capital,
    bs_ncl: entries.ncl,
    bs_cl: entries.cl,
    bs_ppe: entries.ppe,
    bs_onca: entries.onca,
    bs_ca: entries.ca,
  };

  for (const [sectionKey, rows] of Object.entries(sectionMap)) {
    const sectionFields = grouped.get(sectionKey) ?? [];
    const maxRows = Math.max(rows.length, Math.ceil(sectionFields.length / 2));

    for (let rowN = 1; rowN <= maxRows; rowN++) {
      const row = rows[rowN - 1];
      const accountField = sectionFields.find(
        (f) => f.field_name === `${sectionKey}_row${rowN}_account`
      );
      const amountField = sectionFields.find(
        (f) => f.field_name === `${sectionKey}_row${rowN}_amount`
      );

      if (!accountField && !amountField) {
        continue;
      }

      if (accountField) {
        answers.push({
          field_id: accountField.id,
          entered_value: (row?.account ?? "").trim(),
        });
      }

      if (amountField) {
        answers.push({
          field_id: amountField.id,
          entered_value: normalizeAmountInput(row?.amount),
        });
      }
    }
  }

  return answers;
}

// ─── Section breakdown builder ────────────────────────────────────────────────
export function buildFSSectionBreakdown(
  fields: FSFieldRecord[],
  entries: FSEntries
): FSSectionResult[] {
  const grouped = parseFSFields(fields);

  const sectionMap: Record<string, FSRow[]> = {
    pl_direct_expense: entries.directExpense,
    pl_direct_income: entries.directIncome,
    pl_indirect_expense: entries.indirectExpense,
    pl_indirect_income: entries.indirectIncome,
    bs_capital: entries.capital,
    bs_ncl: entries.ncl,
    bs_cl: entries.cl,
    bs_ppe: entries.ppe,
    bs_onca: entries.onca,
    bs_ca: entries.ca,
  };

  const breakdown: FSSectionResult[] = [];

  for (const [sectionKey, rows] of Object.entries(sectionMap)) {
    const sectionFields = grouped.get(sectionKey) ?? [];
    const maxRows = Math.max(rows.length, Math.ceil(sectionFields.length / 2));
    let totalScore = 0;

    for (let rowN = 1; rowN <= maxRows; rowN++) {
      const accountField = sectionFields.find(
        (f) => f.field_name === `${sectionKey}_row${rowN}_account`
      );
      const amountField = sectionFields.find(
        (f) => f.field_name === `${sectionKey}_row${rowN}_amount`
      );

      if (!accountField && !amountField) continue;

      const expectedAccount = (accountField?.expected_value ?? "").trim();
      const expectedAmount = (amountField?.expected_value ?? "").trim();
      const enteredAccount = (rows[rowN - 1]?.account ?? "").trim();
      const enteredAmount = (rows[rowN - 1]?.amount ?? "").trim();

      const { totalScore: rowScore } = scoreRow(
        enteredAccount,
        expectedAccount,
        enteredAmount,
        expectedAmount
      );

      totalScore += rowScore;
    }

    const maxScore = Math.max(maxRows, 0);
    breakdown.push({
      section: getSectionLabel(sectionKey),
      totalScore,
      maxScore,
      accuracy: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
    });
  }

  return breakdown;
}

// ─── Evaluation result builder ────────────────────────────────────────────────
export function buildFSEvaluationResult(
  fields: FSFieldRecord[],
  entries: FSEntries,
  startTime: number,
  endTime: number
): FSEvaluationResult {
  const grouped = parseFSFields(fields);
  const sectionBreakdown = buildFSSectionBreakdown(fields, entries);

  const sectionMap: Record<string, FSRow[]> = {
    pl_direct_expense: entries.directExpense,
    pl_direct_income: entries.directIncome,
    pl_indirect_expense: entries.indirectExpense,
    pl_indirect_income: entries.indirectIncome,
    bs_capital: entries.capital,
    bs_ncl: entries.ncl,
    bs_cl: entries.cl,
    bs_ppe: entries.ppe,
    bs_onca: entries.onca,
    bs_ca: entries.ca,
  };

  const fieldBreakdown: EvaluationResult["fieldBreakdown"] = [];

  for (const [sectionKey, rows] of Object.entries(sectionMap)) {
    const sectionFields = grouped.get(sectionKey) ?? [];
    const maxRows = Math.max(rows.length, Math.ceil(sectionFields.length / 2));

    for (let rowN = 1; rowN <= maxRows; rowN++) {
      const accountField = sectionFields.find(
        (f) => f.field_name === `${sectionKey}_row${rowN}_account`
      );
      const amountField = sectionFields.find(
        (f) => f.field_name === `${sectionKey}_row${rowN}_amount`
      );

      if (!accountField && !amountField) continue;

      const expectedAccount = (accountField?.expected_value ?? "").trim();
      const expectedAmount = (amountField?.expected_value ?? "").trim();
      const enteredAccount = (rows[rowN - 1]?.account ?? "").trim();
      const enteredAmount = (rows[rowN - 1]?.amount ?? "").trim();

      const { totalScore: rowScore, status } = scoreRow(
        enteredAccount,
        expectedAccount,
        enteredAmount,
        expectedAmount
      );

      fieldBreakdown.push({
        field: `${getSectionLabel(sectionKey)} Row ${rowN}`,
        entered: `${enteredAccount || "(empty)"} | ₹${enteredAmount || "0"}`,
        expected: `${expectedAccount || "(empty)"} | ₹${expectedAmount || "0"}`,
        score: rowScore,
        status,
      });
    }
  }

  const totalScore = fieldBreakdown.reduce((s, f) => s + f.score, 0);
  const maxPossibleScore = fieldBreakdown.length;
  const accuracy = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

  return {
    accuracy,
    totalScore,
    maxPossibleScore,
    timeTakenSeconds: Math.max(0, Math.round((endTime - startTime) / 1000)),
    fieldBreakdown,
    sectionBreakdown,
  };
}
