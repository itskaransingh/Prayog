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
const FS_FIELD_PATTERN = /^(?:fs_)?(pl|bs)_([\w]+)_row(\d+)_(account|amount)$/i;
const LEGACY_ROW_ACCOUNT_PATTERN = /^row(\d+)_account$/i;
const LEGACY_ROW_AMOUNT_PATTERN = /^row(\d+)_(debit|credit)_amount$/i;

interface LegacyFSFieldGroup {
  rowNumber: number;
  account?: FSFieldRecord;
  debitAmount?: FSFieldRecord;
  creditAmount?: FSFieldRecord;
}

interface FlattenedFSRow {
  sectionKey: string;
  account: string;
  debitAmount: string;
  creditAmount: string;
}

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

function getSectionMap(entries: FSEntries): Record<string, FSRow[]> {
  return {
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
}

function isDebitSection(sectionKey: string): boolean {
  return (
    sectionKey === "pl_direct_expense" ||
    sectionKey === "pl_indirect_expense" ||
    sectionKey === "bs_ppe" ||
    sectionKey === "bs_onca" ||
    sectionKey === "bs_ca"
  );
}

function flattenEntries(entries: FSEntries): FlattenedFSRow[] {
  return Object.entries(getSectionMap(entries)).flatMap(([sectionKey, rows]) =>
    rows
      .filter((row) => row.account.trim() || row.amount.trim())
      .map((row) => ({
        sectionKey,
        account: row.account.trim(),
        debitAmount: isDebitSection(sectionKey) ? normalizeAmountInput(row.amount) : "0",
        creditAmount: isDebitSection(sectionKey) ? "0" : normalizeAmountInput(row.amount),
      })),
  );
}

function parseLegacyFSFields(fields: FSFieldRecord[]): LegacyFSFieldGroup[] {
  const grouped = new Map<number, LegacyFSFieldGroup>();

  for (const field of fields) {
    const name = field.field_name ?? "";
    const accountMatch = name.match(LEGACY_ROW_ACCOUNT_PATTERN);
    if (accountMatch) {
      const rowNumber = Number(accountMatch[1]);
      const current = grouped.get(rowNumber) ?? { rowNumber };
      current.account = field;
      grouped.set(rowNumber, current);
      continue;
    }

    const amountMatch = name.match(LEGACY_ROW_AMOUNT_PATTERN);
    if (!amountMatch) {
      continue;
    }

    const rowNumber = Number(amountMatch[1]);
    const side = amountMatch[2].toLowerCase();
    const current = grouped.get(rowNumber) ?? { rowNumber };
    if (side === "debit") {
      current.debitAmount = field;
    } else {
      current.creditAmount = field;
    }
    grouped.set(rowNumber, current);
  }

  return [...grouped.values()].sort((a, b) => a.rowNumber - b.rowNumber);
}

function isLegacyFSFieldSet(fields: FSFieldRecord[]): boolean {
  return parseLegacyFSFields(fields).length > 0;
}

function buildLegacyFSPairs(fields: FSFieldRecord[], entries: FSEntries) {
  const legacyFields = parseLegacyFSFields(fields);
  const availableRows = [...flattenEntries(entries)];
  const pairs = legacyFields.map((fieldGroup) => {
    const expectedAccount = (fieldGroup.account?.expected_value ?? "").trim();
    const expectedDebit = normalizeAmountInput(fieldGroup.debitAmount?.expected_value);
    const expectedCredit = normalizeAmountInput(fieldGroup.creditAmount?.expected_value);

    let matchIndex = availableRows.findIndex((row) => normalizeValue(row.account) === normalizeValue(expectedAccount));
    if (matchIndex === -1) {
      matchIndex = availableRows.findIndex((row) => row.account || row.debitAmount !== "0" || row.creditAmount !== "0");
    }

    const matchedRow = matchIndex >= 0 ? availableRows.splice(matchIndex, 1)[0] : undefined;

    return {
      fieldGroup,
      enteredAccount: matchedRow?.account ?? "",
      enteredDebit: matchedRow?.debitAmount ?? "",
      enteredCredit: matchedRow?.creditAmount ?? "",
      expectedAccount,
      expectedDebit,
      expectedCredit,
    };
  });

  return pairs;
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
        ((f.field_name?.startsWith(sectionKey) || f.field_name?.startsWith(`fs_${sectionKey}`)) &&
          f.field_name?.endsWith("account")) ||
        Boolean(f.field_name?.match(LEGACY_ROW_ACCOUNT_PATTERN))
    )
    .flatMap((f) => (Array.isArray(f.options) ? f.options : []));
  return Array.from(new Set(opts));
}

// ─── Attempt answers builder ──────────────────────────────────────────────────
export function buildFSAttemptAnswers(
  fields: FSFieldRecord[],
  entries: FSEntries
): SimulationAttemptAnswerInput[] {
  if (isLegacyFSFieldSet(fields)) {
    return buildLegacyFSPairs(fields, entries).flatMap(({ fieldGroup, enteredAccount, enteredDebit, enteredCredit }) => {
      const answers: SimulationAttemptAnswerInput[] = [];
      if (fieldGroup.account) {
        answers.push({ field_id: fieldGroup.account.id, entered_value: enteredAccount });
      }
      if (fieldGroup.debitAmount) {
        answers.push({ field_id: fieldGroup.debitAmount.id, entered_value: enteredDebit });
      }
      if (fieldGroup.creditAmount) {
        answers.push({ field_id: fieldGroup.creditAmount.id, entered_value: enteredCredit });
      }
      return answers;
    });
  }

  const answers: SimulationAttemptAnswerInput[] = [];
  const grouped = parseFSFields(fields);
  const sectionMap = getSectionMap(entries);

  for (const [sectionKey, rows] of Object.entries(sectionMap)) {
    const sectionFields =
      grouped.get(sectionKey) ??
      grouped.get(`fs_${sectionKey}`) ??
      [];
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
  if (isLegacyFSFieldSet(fields)) {
    const legacyPairs = buildLegacyFSPairs(fields, entries);
    const totalScore = legacyPairs.reduce((sum, pair) => {
      const expectedAmount = pair.expectedDebit !== "0" ? pair.expectedDebit : pair.expectedCredit;
      const enteredAmount = pair.expectedDebit !== "0" ? pair.enteredDebit : pair.enteredCredit;
      return sum + scoreRow(pair.enteredAccount, pair.expectedAccount, enteredAmount, expectedAmount).totalScore;
    }, 0);
    const maxScore = legacyPairs.length;

    return [
      {
        section: "Statement Rows",
        totalScore,
        maxScore,
        accuracy: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
      },
    ];
  }

  const grouped = parseFSFields(fields);
  const sectionMap = getSectionMap(entries);

  const breakdown: FSSectionResult[] = [];

  for (const [sectionKey, rows] of Object.entries(sectionMap)) {
    const sectionFields =
      grouped.get(sectionKey) ??
      grouped.get(`fs_${sectionKey}`) ??
      [];
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
  if (isLegacyFSFieldSet(fields)) {
    const legacyPairs = buildLegacyFSPairs(fields, entries);
    const fieldBreakdown: EvaluationResult["fieldBreakdown"] = legacyPairs.map((pair) => {
      const expectedSide = pair.expectedDebit !== "0" ? "Debit" : "Credit";
      const expectedAmount = expectedSide === "Debit" ? pair.expectedDebit : pair.expectedCredit;
      const enteredAmount = expectedSide === "Debit" ? pair.enteredDebit : pair.enteredCredit;
      const { totalScore: rowScore, status } = scoreRow(
        pair.enteredAccount,
        pair.expectedAccount,
        enteredAmount,
        expectedAmount,
      );

      return {
        field: `Statement Row ${pair.fieldGroup.rowNumber}`,
        entered: `${pair.enteredAccount || "(empty)"} | ₹${enteredAmount || "0"}`,
        expected: `${pair.expectedAccount || "(empty)"} | ₹${expectedAmount || "0"}`,
        score: rowScore,
        status,
      };
    });
    const totalScore = fieldBreakdown.reduce((sum, row) => sum + row.score, 0);
    const maxPossibleScore = fieldBreakdown.length;

    return {
      accuracy: maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0,
      totalScore,
      maxPossibleScore,
      timeTakenSeconds: Math.max(0, Math.round((endTime - startTime) / 1000)),
      fieldBreakdown,
      sectionBreakdown: buildFSSectionBreakdown(fields, entries),
    };
  }

  const grouped = parseFSFields(fields);
  const sectionBreakdown = buildFSSectionBreakdown(fields, entries);
  const sectionMap = getSectionMap(entries);

  const fieldBreakdown: EvaluationResult["fieldBreakdown"] = [];

  for (const [sectionKey, rows] of Object.entries(sectionMap)) {
    const sectionFields =
      grouped.get(sectionKey) ??
      grouped.get(`fs_${sectionKey}`) ??
      [];
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
