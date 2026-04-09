import type { EvaluationResult } from "@/lib/evaluation";
import type { SimulationAttemptAnswerInput } from "@/lib/simulation/attempts";

export interface SimulationFieldRecord {
  id: string;
  field_name: string | null;
  field_label: string | null;
  expected_value: string | null;
  order_index?: number | null;
}

interface SideFieldGroup {
  order: number;
  account?: SimulationFieldRecord;
  amount?: SimulationFieldRecord;
}

export interface GridFieldGroup {
  rowNumber: number;
  account?: SimulationFieldRecord;
  debitAccount?: SimulationFieldRecord;
  debitAmount?: SimulationFieldRecord;
  creditAccount?: SimulationFieldRecord;
  creditAmount?: SimulationFieldRecord;
  debitLines?: SideFieldGroup[];
  creditLines?: SideFieldGroup[];
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

const ROW_ACCOUNT_PATTERN = /^row(\d+)_account$/i;
const ROW_FIELD_PATTERN = /^row(\d+)_(debit|credit)_(account|amount)$/i;
const JOURNAL_LINE_FIELD_PATTERN = /^row(\d+)_(debit|credit)(\d+)_(account|amount)$/i;

function isZeroAmount(value: string | null | undefined): boolean {
  return Number((value ?? "").trim().replaceAll(",", "") || "0") === 0;
}

function getExpectedSide(rowGroup: GridFieldGroup): "debit" | "credit" | null {
  if (rowGroup.debitAmount && rowGroup.creditAmount) {
    const debitIsZero = isZeroAmount(rowGroup.debitAmount.expected_value);
    const creditIsZero = isZeroAmount(rowGroup.creditAmount.expected_value);

    if (!debitIsZero && creditIsZero) {
      return "debit";
    }
    if (!creditIsZero && debitIsZero) {
      return "credit";
    }
  }

  if (rowGroup.debitAccount || rowGroup.debitAmount) {
    return "debit";
  }
  if (rowGroup.creditAccount || rowGroup.creditAmount) {
    return "credit";
  }
  return null;
}

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

function addOrUpdateSideLine(
  lines: SideFieldGroup[] | undefined,
  order: number,
  kind: "account" | "amount",
  field: SimulationFieldRecord,
): SideFieldGroup[] {
  const current = lines ?? [];
  const existing = current.find((item) => item.order === order) ?? { order };

  if (kind === "account") {
    existing.account = field;
  } else {
    existing.amount = field;
  }

  return [...current.filter((item) => item.order !== order), existing].sort(
    (left, right) => left.order - right.order,
  );
}

function getSideLines(
  rowGroup: GridFieldGroup,
  side: "debit" | "credit",
): SideFieldGroup[] {
  const explicitLines = side === "debit" ? rowGroup.debitLines : rowGroup.creditLines;
  if (explicitLines && explicitLines.length > 0) {
    return explicitLines;
  }

  if (side === "debit" && (rowGroup.debitAccount || rowGroup.debitAmount)) {
    return [{ order: 1, account: rowGroup.debitAccount, amount: rowGroup.debitAmount }];
  }

  if (side === "credit" && (rowGroup.creditAccount || rowGroup.creditAmount)) {
    return [{ order: 1, account: rowGroup.creditAccount, amount: rowGroup.creditAmount }];
  }

  return [];
}

function groupByRowAndSide(fields: SimulationFieldRecord[]): Map<number, GridFieldGroup> {
  const grouped = new Map<number, GridFieldGroup>();

  for (const field of fields) {
    const rawName = field.field_name ?? "";
    const accountMatch = rawName.match(ROW_ACCOUNT_PATTERN);
    if (accountMatch) {
      const rowNumber = Number(accountMatch[1]);
      const current = grouped.get(rowNumber) ?? { rowNumber };
      current.account = field;
      grouped.set(rowNumber, current);
      continue;
    }

    const rowMatch = rawName.match(ROW_FIELD_PATTERN);
    if (rowMatch) {
      const rowNumber = Number(rowMatch[1]);
      const side = rowMatch[2].toLowerCase() as "debit" | "credit";
      const kind = rowMatch[3].toLowerCase() as "account" | "amount";
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
      continue;
    }

    const journalMatch = rawName.match(JOURNAL_LINE_FIELD_PATTERN);
    if (!journalMatch) {
      continue;
    }

    const rowNumber = Number(journalMatch[1]);
    const side = journalMatch[2].toLowerCase() as "debit" | "credit";
    const order = Number(journalMatch[3]);
    const kind = journalMatch[4].toLowerCase() as "account" | "amount";
    const current = grouped.get(rowNumber) ?? { rowNumber };

    if (side === "debit") {
      current.debitLines = addOrUpdateSideLine(current.debitLines, order, kind, field);
    } else {
      current.creditLines = addOrUpdateSideLine(current.creditLines, order, kind, field);
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
    const enteredDebitLines = lines.filter((line) => Boolean(trimValue(line.dr)));
    const enteredCreditLines = lines.filter((line) => Boolean(trimValue(line.cr)));

    if (rowGroup.account) {
      answers.push({
        field_id: rowGroup.account.id,
        entered_value: trimValue(getFirstFilledJournalLine(lines)?.account),
      });
    }

    getSideLines(rowGroup, "debit").forEach((line, index) => {
      const enteredLine = enteredDebitLines[index];
      if (line.account?.id) {
        answers.push({
          field_id: line.account.id,
          entered_value: trimValue(enteredLine?.account),
        });
      }
      if (line.amount?.id) {
        answers.push({
          field_id: line.amount.id,
          entered_value: normalizeAmount(enteredLine?.dr),
        });
      }
    });

    getSideLines(rowGroup, "credit").forEach((line, index) => {
      const enteredLine = enteredCreditLines[index];
      if (line.account?.id) {
        answers.push({
          field_id: line.account.id,
          entered_value: trimValue(enteredLine?.account),
        });
      }
      if (line.amount?.id) {
        answers.push({
          field_id: line.amount.id,
          entered_value: normalizeAmount(enteredLine?.cr),
        });
      }
    });
  }

  return answers;
}

export function buildLedgerAttemptAnswers(
  groupedFields: GridFieldGroup[],
  drEntries: LedgerLineInput[],
  crEntries: LedgerLineInput[],
): SimulationAttemptAnswerInput[] {
  const answers: SimulationAttemptAnswerInput[] = [];
  let debitIndex = 0;
  let creditIndex = 0;

  for (const rowGroup of groupedFields) {
    getSideLines(rowGroup, "debit").forEach((line) => {
      const drLine = drEntries[debitIndex++];
      if (line.account?.id) {
        answers.push({ field_id: line.account.id, entered_value: trimValue(drLine?.account) });
      }
      if (line.amount?.id) {
        answers.push({ field_id: line.amount.id, entered_value: normalizeAmount(drLine?.amount) });
      }
    });

    getSideLines(rowGroup, "credit").forEach((line) => {
      const crLine = crEntries[creditIndex++];
      if (line.account?.id) {
        answers.push({ field_id: line.account.id, entered_value: trimValue(crLine?.account) });
      }
      if (line.amount?.id) {
        answers.push({ field_id: line.amount.id, entered_value: normalizeAmount(crLine?.amount) });
      }
    });
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

function pushJournalSideBreakdown(
  rows: GridBreakdownRow[],
  rowNumber: number,
  side: "debit" | "credit",
  expectedLines: SideFieldGroup[],
  enteredLines: JournalLineInput[],
): void {
  const maxRows = Math.max(expectedLines.length, enteredLines.length);

  for (let index = 0; index < maxRows; index += 1) {
    const expectedLine = expectedLines[index];
    const enteredLine = enteredLines[index];
    const breakdownRow = evaluateSide(
      rowNumber,
      side,
      trimValue(enteredLine?.account),
      side === "debit" ? trimValue(enteredLine?.dr) : trimValue(enteredLine?.cr),
      trimValue(expectedLine?.account?.expected_value),
      trimValue(expectedLine?.amount?.expected_value),
    );
    if (breakdownRow) {
      rows.push(breakdownRow);
    }
  }
}

export function buildJournalBreakdownRows(
  groupedFields: GridFieldGroup[],
  entriesByRow: Record<number, JournalLineInput[]>,
): GridBreakdownRow[] {
  const rows: GridBreakdownRow[] = [];

  for (const rowGroup of groupedFields) {
    const lines = entriesByRow[rowGroup.rowNumber - 1] ?? [];
    pushJournalSideBreakdown(
      rows,
      rowGroup.rowNumber,
      "debit",
      getSideLines(rowGroup, "debit"),
      lines.filter((line) => Boolean(trimValue(line.dr))),
    );
    pushJournalSideBreakdown(
      rows,
      rowGroup.rowNumber,
      "credit",
      getSideLines(rowGroup, "credit"),
      lines.filter((line) => Boolean(trimValue(line.cr))),
    );
  }

  return rows;
}

export function buildLedgerBreakdownRows(
  groupedFields: GridFieldGroup[],
  drEntries: LedgerLineInput[],
  crEntries: LedgerLineInput[],
): GridBreakdownRow[] {
  const rows: GridBreakdownRow[] = [];
  let debitIndex = 0;
  let creditIndex = 0;

  for (const rowGroup of groupedFields) {
    getSideLines(rowGroup, "debit").forEach((line) => {
      const drLine = drEntries[debitIndex++];
      const debitRow = evaluateSide(
        rowGroup.rowNumber,
        "debit",
        trimValue(drLine?.account),
        trimValue(drLine?.amount),
        trimValue(line.account?.expected_value),
        trimValue(line.amount?.expected_value),
      );
      if (debitRow) {
        rows.push(debitRow);
      }
    });

    getSideLines(rowGroup, "credit").forEach((line) => {
      const crLine = crEntries[creditIndex++];
      const creditRow = evaluateSide(
        rowGroup.rowNumber,
        "credit",
        trimValue(crLine?.account),
        trimValue(crLine?.amount),
        trimValue(line.account?.expected_value),
        trimValue(line.amount?.expected_value),
      );
      if (creditRow) {
        rows.push(creditRow);
      }
    });
  }

  return rows;
}

export function buildTrialBalanceBreakdownRows(
  groupedFields: GridFieldGroup[],
  entriesByRow: Record<number, JournalLineInput[]>,
): GridBreakdownRow[] {
  const rows: GridBreakdownRow[] = [];

  for (const rowGroup of groupedFields) {
    const expectedSide = getExpectedSide(rowGroup);
    if (!expectedSide) {
      continue;
    }

    const line = entriesByRow[rowGroup.rowNumber - 1]?.[0];
    const enteredAccount = trimValue(line?.account);
    const enteredDebitAmount = trimValue(line?.dr);
    const enteredCreditAmount = trimValue(line?.cr);
    const enteredSide = enteredDebitAmount
      ? "debit"
      : enteredCreditAmount
      ? "credit"
      : expectedSide;
    const enteredAmount = enteredSide === "debit" ? enteredDebitAmount : enteredCreditAmount;
    const expectedAccount =
      trimValue(rowGroup.account?.expected_value) ||
      (expectedSide === "debit"
        ? trimValue(rowGroup.debitAccount?.expected_value)
        : trimValue(rowGroup.creditAccount?.expected_value));
    const expectedAmount =
      expectedSide === "debit"
        ? trimValue(rowGroup.debitAmount?.expected_value)
        : trimValue(rowGroup.creditAmount?.expected_value);
    const accountOk = enteredAccount === expectedAccount;
    const amountOk = normalizeAmount(enteredAmount) === normalizeAmount(expectedAmount);

    rows.push({
      rowNumber: rowGroup.rowNumber,
      side: enteredSide,
      amountType: enteredSide === "debit" ? "Debit" : "Credit",
      particular: enteredAccount || "(empty)",
      amount: enteredAmount || "(empty)",
      expectedParticular: expectedAccount || "(empty)",
      expectedAmount: expectedAmount || "(empty)",
      status: enteredSide === expectedSide && accountOk && amountOk ? "correct" : "incorrect",
    });
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
