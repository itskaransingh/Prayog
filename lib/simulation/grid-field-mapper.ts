import type { EvaluationResult } from "@/lib/evaluation";
import type { SimulationAttemptAnswerInput } from "@/lib/simulation/attempts";

export interface SimulationFieldRecord {
  id: string;
  field_name: string | null;
  field_label: string | null;
  expected_value: string | null;
  order_index?: number | null;
}

export interface GridFieldGroup {
  rowNumber: number;
  debitAccount?: SimulationFieldRecord;
  debitAmount?: SimulationFieldRecord;
  creditAccount?: SimulationFieldRecord;
  creditAmount?: SimulationFieldRecord;
}

export interface JournalLineInput {
  account?: string;
  dr?: string;
  cr?: string;
}

export interface LedgerLineInput {
  account?: string;
  amount?: string;
}

export interface GridBreakdownRow {
  rowNumber: number;
  side: "debit" | "credit";
  amountType: "Debit" | "Credit";
  particular: string;
  amount: string;
  expectedParticular: string;
  expectedAmount: string;
  status: "correct" | "incorrect";
}

const ROW_FIELD_PATTERN = /^row(\d+)_(debit|credit)_(account|amount)$/i;

function trimValue(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function normalizeAmount(value: string | null | undefined): string {
  return trimValue(value).replaceAll(",", "");
}

function isFilledLine(line: JournalLineInput | LedgerLineInput): boolean {
  const account = trimValue(line.account);
  const dr = "dr" in line ? trimValue(line.dr) : "";
  const cr = "cr" in line ? trimValue(line.cr) : "";
  const amount = "amount" in line ? trimValue(line.amount) : "";

  return Boolean(account || dr || cr || amount);
}

function getFirstFilledJournalLine(lines: JournalLineInput[]): JournalLineInput | undefined {
  return lines.find(isFilledLine);
}

function getFirstDebitJournalLine(lines: JournalLineInput[]): JournalLineInput | undefined {
  return lines.find((line) => Boolean(trimValue(line.dr))) ?? getFirstFilledJournalLine(lines);
}

function getFirstCreditJournalLine(lines: JournalLineInput[]): JournalLineInput | undefined {
  return lines.find((line) => Boolean(trimValue(line.cr))) ?? getFirstFilledJournalLine(lines);
}

function groupByRowAndSide(fields: SimulationFieldRecord[]): Map<number, GridFieldGroup> {
  const grouped = new Map<number, GridFieldGroup>();

  for (const field of fields) {
    const rawName = field.field_name ?? "";
    const match = rawName.match(ROW_FIELD_PATTERN);
    if (!match) {
      continue;
    }

    const rowNumber = Number(match[1]);
    const side = match[2].toLowerCase() as "debit" | "credit";
    const kind = match[3].toLowerCase() as "account" | "amount";

    const current = grouped.get(rowNumber) ?? { rowNumber };
    if (side === "debit" && kind === "account") {
      current.debitAccount = field;
    } else if (side === "debit" && kind === "amount") {
      current.debitAmount = field;
    } else if (side === "credit" && kind === "account") {
      current.creditAccount = field;
    } else if (side === "credit" && kind === "amount") {
      current.creditAmount = field;
    }

    grouped.set(rowNumber, current);
  }

  return grouped;
}

export function normalizeGridFields(fields: SimulationFieldRecord[]): GridFieldGroup[] {
  const grouped = groupByRowAndSide(fields);
  return [...grouped.values()].sort((a, b) => a.rowNumber - b.rowNumber);
}

export function buildJournalAttemptAnswers(
  groupedFields: GridFieldGroup[],
  entriesByRow: Record<number, JournalLineInput[]>,
): SimulationAttemptAnswerInput[] {
  const answers: SimulationAttemptAnswerInput[] = [];

  for (const rowGroup of groupedFields) {
    const lines = entriesByRow[rowGroup.rowNumber - 1] ?? [];
    const debitLine = getFirstDebitJournalLine(lines);
    const creditLine = getFirstCreditJournalLine(lines);
    if (!debitLine && !creditLine) {
      continue;
    }

    const debitAccount = trimValue(debitLine?.account);
    const creditAccount = trimValue(creditLine?.account);
    const debitAmount = normalizeAmount(debitLine?.dr);
    const creditAmount = normalizeAmount(creditLine?.cr);

    if (rowGroup.debitAccount && debitAccount) {
      answers.push({ field_id: rowGroup.debitAccount.id, entered_value: debitAccount });
    }
    if (rowGroup.debitAmount && debitAmount) {
      answers.push({ field_id: rowGroup.debitAmount.id, entered_value: debitAmount });
    }
    if (rowGroup.creditAccount && creditAccount) {
      answers.push({ field_id: rowGroup.creditAccount.id, entered_value: creditAccount });
    }
    if (rowGroup.creditAmount && creditAmount) {
      answers.push({ field_id: rowGroup.creditAmount.id, entered_value: creditAmount });
    }
  }

  return answers;
}

export function buildLedgerAttemptAnswers(
  groupedFields: GridFieldGroup[],
  drEntries: LedgerLineInput[],
  crEntries: LedgerLineInput[],
): SimulationAttemptAnswerInput[] {
  const answers: SimulationAttemptAnswerInput[] = [];

  for (const rowGroup of groupedFields) {
    const drLine = drEntries[rowGroup.rowNumber - 1];
    const crLine = crEntries[rowGroup.rowNumber - 1];

    if (rowGroup.debitAccount && trimValue(drLine?.account)) {
      answers.push({ field_id: rowGroup.debitAccount.id, entered_value: trimValue(drLine.account) });
    }
    if (rowGroup.debitAmount && trimValue(drLine?.amount)) {
      answers.push({ field_id: rowGroup.debitAmount.id, entered_value: normalizeAmount(drLine.amount) });
    }
    if (rowGroup.creditAccount && trimValue(crLine?.account)) {
      answers.push({ field_id: rowGroup.creditAccount.id, entered_value: trimValue(crLine.account) });
    }
    if (rowGroup.creditAmount && trimValue(crLine?.amount)) {
      answers.push({ field_id: rowGroup.creditAmount.id, entered_value: normalizeAmount(crLine.amount) });
    }
  }

  return answers;
}

function evaluateSide(
  rowNumber: number,
  side: "debit" | "credit",
  enteredParticular: string,
  enteredAmount: string,
  expectedParticular: string,
  expectedAmount: string,
): GridBreakdownRow | null {
  if (!enteredParticular && !enteredAmount && !expectedParticular && !expectedAmount) {
    return null;
  }

  const accountOk = trimValue(enteredParticular) === trimValue(expectedParticular);
  const amountOk = normalizeAmount(enteredAmount) === normalizeAmount(expectedAmount);

  return {
    rowNumber,
    side,
    amountType: side === "debit" ? "Debit" : "Credit",
    particular: enteredParticular || "(empty)",
    amount: enteredAmount || "(empty)",
    expectedParticular,
    expectedAmount,
    status: accountOk && amountOk ? "correct" : "incorrect",
  };
}

export function buildJournalBreakdownRows(
  groupedFields: GridFieldGroup[],
  entriesByRow: Record<number, JournalLineInput[]>,
): GridBreakdownRow[] {
  const rows: GridBreakdownRow[] = [];

  for (const rowGroup of groupedFields) {
    const lines = entriesByRow[rowGroup.rowNumber - 1] ?? [];
    for (const line of lines) {
      const hasDebit = Boolean(trimValue(line.dr));
      const hasCredit = Boolean(trimValue(line.cr));

      if (!hasDebit && !hasCredit && !trimValue(line.account)) {
        continue;
      }

      if (hasDebit) {
        const debitRow = evaluateSide(
          rowGroup.rowNumber,
          "debit",
          trimValue(line.account),
          trimValue(line.dr),
          trimValue(rowGroup.debitAccount?.expected_value),
          trimValue(rowGroup.debitAmount?.expected_value),
        );
        if (debitRow) {
          rows.push(debitRow);
        }
      } else if (hasCredit) {
        const creditRow = evaluateSide(
          rowGroup.rowNumber,
          "credit",
          trimValue(line.account),
          trimValue(line.cr),
          trimValue(rowGroup.creditAccount?.expected_value),
          trimValue(rowGroup.creditAmount?.expected_value),
        );
        if (creditRow) {
          rows.push(creditRow);
        }
      }
    }
  }

  return rows;
}

export function buildLedgerBreakdownRows(
  groupedFields: GridFieldGroup[],
  drEntries: LedgerLineInput[],
  crEntries: LedgerLineInput[],
): GridBreakdownRow[] {
  const rows: GridBreakdownRow[] = [];

  for (const rowGroup of groupedFields) {
    const drLine = drEntries[rowGroup.rowNumber - 1];
    const crLine = crEntries[rowGroup.rowNumber - 1];

    const debitRow = evaluateSide(
      rowGroup.rowNumber,
      "debit",
      trimValue(drLine?.account),
      trimValue(drLine?.amount),
      trimValue(rowGroup.debitAccount?.expected_value),
      trimValue(rowGroup.debitAmount?.expected_value),
    );
    if (debitRow) {
      rows.push(debitRow);
    }

    const creditRow = evaluateSide(
      rowGroup.rowNumber,
      "credit",
      trimValue(crLine?.account),
      trimValue(crLine?.amount),
      trimValue(rowGroup.creditAccount?.expected_value),
      trimValue(rowGroup.creditAmount?.expected_value),
    );
    if (creditRow) {
      rows.push(creditRow);
    }
  }

  return rows;
}

export function buildGridEvaluationResult(
  breakdownRows: GridBreakdownRow[],
  startTime: number,
  endTime: number,
): EvaluationResult {
  const totalScore = breakdownRows.reduce((sum, row) => sum + (row.status === "correct" ? 1 : 0), 0);
  const maxPossibleScore = breakdownRows.length;
  const accuracy = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

  return {
    accuracy,
    totalScore,
    maxPossibleScore,
    timeTakenSeconds: Math.max(0, Math.round((endTime - startTime) / 1000)),
    fieldBreakdown: breakdownRows.map((row) => ({
      rowNumber: row.rowNumber,
      side: row.side,
      amountType: row.amountType,
      particular: row.particular,
      amount: row.amount,
      expectedParticular: row.expectedParticular,
      expectedAmount: row.expectedAmount,
      field: `Row ${row.rowNumber} ${row.side === "debit" ? "Debit" : "Credit"}`,
      entered: `${row.particular} | ${row.amountType} | ${row.amount}`,
      expected: `${row.expectedParticular} | ${row.expectedAmount}`,
      score: row.status === "correct" ? 1 : 0,
      status: row.status,
    })),
  };
}
