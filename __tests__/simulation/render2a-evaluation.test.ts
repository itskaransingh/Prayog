import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildGridEvaluationResult,
  buildJournalAttemptAnswers,
  buildTrialBalanceBreakdownRows,
  normalizeGridFields,
  type JournalLineInput,
  type SimulationFieldRecord,
} from "@/lib/simulation/grid-field-mapper";

function makeField(field: Partial<SimulationFieldRecord> & Pick<SimulationFieldRecord, "id" | "field_name" | "expected_value">): SimulationFieldRecord {
  return {
    field_label: null,
    order_index: null,
    ...field,
  };
}

function evaluate(fields: SimulationFieldRecord[], entriesByRow: Record<number, JournalLineInput[]>) {
  const groupedFields = normalizeGridFields(fields);
  const answers = buildJournalAttemptAnswers(groupedFields, entriesByRow);
  const breakdownRows = buildTrialBalanceBreakdownRows(groupedFields, entriesByRow);
  const result = buildGridEvaluationResult(breakdownRows, 0, 1000);

  return { answers, breakdownRows, result };
}

describe("Trial Balance Evaluation", () => {
  it("should score 100% when all accounts and amounts match exactly", () => {
    const fields = [
      makeField({ id: "f1", field_name: "row1_debit_account", expected_value: "Cash" }),
      makeField({ id: "f2", field_name: "row1_debit_amount", expected_value: "50000" }),
      makeField({ id: "f3", field_name: "row2_credit_account", expected_value: "Capital Account" }),
      makeField({ id: "f4", field_name: "row2_credit_amount", expected_value: "50000" }),
    ];

    const { answers, breakdownRows, result } = evaluate(fields, {
      0: [{ account: "Cash", dr: "50,000" }],
      1: [{ account: "Capital Account", cr: "50000" }],
    });

    assert.equal(answers.length, 4);
    assert.equal(breakdownRows.length, 2);
    assert.equal(result.accuracy, 100);
    assert.equal(result.totalScore, 2);
    assert.equal(result.maxPossibleScore, 2);
    assert.ok(result.fieldBreakdown.every((row) => row.status === "correct"));
  });

  it("should score 0% when all accounts are wrong", () => {
    const fields = [
      makeField({ id: "f1", field_name: "row1_debit_account", expected_value: "Cash" }),
      makeField({ id: "f2", field_name: "row1_debit_amount", expected_value: "50000" }),
      makeField({ id: "f3", field_name: "row2_credit_account", expected_value: "Capital Account" }),
      makeField({ id: "f4", field_name: "row2_credit_amount", expected_value: "50000" }),
    ];

    const { result } = evaluate(fields, {
      0: [{ account: "Bank", dr: "1000" }],
      1: [{ account: "Loan", cr: "7500" }],
    });

    assert.equal(result.accuracy, 0);
    assert.equal(result.totalScore, 0);
    assert.ok(result.fieldBreakdown.every((row) => row.status === "incorrect"));
  });

  it("should score 50% when half the rows are correct", () => {
    const fields = [
      makeField({ id: "f1", field_name: "row1_debit_account", expected_value: "Cash" }),
      makeField({ id: "f2", field_name: "row1_debit_amount", expected_value: "50000" }),
      makeField({ id: "f3", field_name: "row2_credit_account", expected_value: "Capital Account" }),
      makeField({ id: "f4", field_name: "row2_credit_amount", expected_value: "50000" }),
      makeField({ id: "f5", field_name: "row3_debit_account", expected_value: "Purchases" }),
      makeField({ id: "f6", field_name: "row3_debit_amount", expected_value: "20000" }),
      makeField({ id: "f7", field_name: "row4_credit_account", expected_value: "Outstanding Expenses" }),
      makeField({ id: "f8", field_name: "row4_credit_amount", expected_value: "10000" }),
    ];

    const { result } = evaluate(fields, {
      0: [{ account: "Cash", dr: "50000" }],
      1: [{ account: "Capital Account", cr: "50000" }],
      2: [{ account: "Wrong Purchases", dr: "9999" }],
      3: [{ account: "Wrong Expenses", cr: "0" }],
    });

    assert.equal(result.accuracy, 50);
    assert.equal(result.totalScore, 2);
    assert.equal(result.maxPossibleScore, 4);
  });

  it("should handle credit-only rows correctly", () => {
    const fields = [
      makeField({ id: "f1", field_name: "row1_credit_account", expected_value: "Sales" }),
      makeField({ id: "f2", field_name: "row1_credit_amount", expected_value: "80000" }),
    ];

    const { result } = evaluate(fields, {
      0: [{ account: "Sales", cr: "80000" }],
    });

    assert.equal(result.accuracy, 100);
    assert.equal(result.totalScore, 1);
    assert.equal(result.fieldBreakdown[0].field, "Row 1 Credit");
    assert.equal(result.fieldBreakdown[0].entered, "Sales | Credit | 80000");
  });

  it("should handle debit-only rows correctly", () => {
    const fields = [
      makeField({ id: "f1", field_name: "row1_debit_account", expected_value: "Bank" }),
      makeField({ id: "f2", field_name: "row1_debit_amount", expected_value: "25000" }),
    ];

    const { result } = evaluate(fields, {
      0: [{ account: "Bank", dr: "25000" }],
    });

    assert.equal(result.accuracy, 100);
    assert.equal(result.totalScore, 1);
    assert.equal(result.fieldBreakdown[0].field, "Row 1 Debit");
    assert.equal(result.fieldBreakdown[0].entered, "Bank | Debit | 25000");
  });

  it("should submit blank values for expected trial balance fields", () => {
    const fields = [
      makeField({ id: "f1", field_name: "row1_debit_account", expected_value: "Cash" }),
      makeField({ id: "f2", field_name: "row1_debit_amount", expected_value: "50000" }),
      makeField({ id: "f3", field_name: "row2_credit_account", expected_value: "Capital Account" }),
      makeField({ id: "f4", field_name: "row2_credit_amount", expected_value: "50000" }),
    ];

    const groupedFields = normalizeGridFields(fields);
    const answers = buildJournalAttemptAnswers(groupedFields, {
      0: [{ account: "", dr: "", cr: "" }],
      1: [{ account: "", dr: "", cr: "" }],
    });

    assert.deepEqual(answers, [
      { field_id: "f1", entered_value: "" },
      { field_id: "f2", entered_value: "" },
      { field_id: "f3", entered_value: "" },
      { field_id: "f4", entered_value: "" },
    ]);
  });

  it("should support legacy trial balance rows with rowN_account plus debit and credit amounts", () => {
    const fields = [
      makeField({ id: "f1", field_name: "row1_account", expected_value: "Bank" }),
      makeField({ id: "f2", field_name: "row1_debit_amount", expected_value: "75200" }),
      makeField({ id: "f3", field_name: "row1_credit_amount", expected_value: "0" }),
      makeField({ id: "f4", field_name: "row2_account", expected_value: "Sundry Creditors" }),
      makeField({ id: "f5", field_name: "row2_debit_amount", expected_value: "0" }),
      makeField({ id: "f6", field_name: "row2_credit_amount", expected_value: "25450" }),
    ];

    const groupedFields = normalizeGridFields(fields);
    const answers = buildJournalAttemptAnswers(groupedFields, {
      0: [{ account: "Bank", dr: "75200", cr: "" }],
      1: [{ account: "Sundry Creditors", dr: "", cr: "25450" }],
    });
    const breakdownRows = buildTrialBalanceBreakdownRows(groupedFields, {
      0: [{ account: "Bank", dr: "75200", cr: "" }],
      1: [{ account: "Sundry Creditors", dr: "", cr: "25450" }],
    });

    assert.deepEqual(answers, [
      { field_id: "f1", entered_value: "Bank" },
      { field_id: "f2", entered_value: "75200" },
      { field_id: "f3", entered_value: "" },
      { field_id: "f4", entered_value: "Sundry Creditors" },
      { field_id: "f5", entered_value: "" },
      { field_id: "f6", entered_value: "25450" },
    ]);
    assert.equal(breakdownRows[0].expectedParticular, "Bank");
    assert.equal(breakdownRows[1].expectedParticular, "Sundry Creditors");
  });

  it("should show expected trial balance values even when the user enters the amount on the wrong side", () => {
    const fields = [
      makeField({ id: "f1", field_name: "row1_credit_account", expected_value: "Capital Account" }),
      makeField({ id: "f2", field_name: "row1_credit_amount", expected_value: "50000" }),
    ];

    const groupedFields = normalizeGridFields(fields);
    const breakdownRows = buildTrialBalanceBreakdownRows(groupedFields, {
      0: [{ account: "Capital Account", dr: "50000", cr: "" }],
    });

    assert.equal(breakdownRows.length, 1);
    assert.equal(breakdownRows[0].expectedParticular, "Capital Account");
    assert.equal(breakdownRows[0].expectedAmount, "50000");
    assert.equal(breakdownRows[0].amountType, "Debit");
    assert.equal(breakdownRows[0].status, "incorrect");
  });
});
