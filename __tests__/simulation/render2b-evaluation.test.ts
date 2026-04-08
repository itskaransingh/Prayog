import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildFSAttemptAnswers,
  buildFSEvaluationResult,
  type FSFieldRecord,
  type FSEntries,
  type FSRow,
} from "@/lib/simulation/fs-field-mapper";

function makeField(
  field_name: string,
  expected_value: string,
  id: string,
  options: string[] = [expected_value],
): FSFieldRecord {
  return {
    id,
    field_name,
    field_label: null,
    expected_value,
    options,
  };
}

function row(account: string, amount: string, id: number): FSRow {
  return { id, account, amount };
}

function evaluate(fields: FSFieldRecord[], entries: FSEntries) {
  return buildFSEvaluationResult(fields, entries, 0, 1000);
}

function statementTotals(entries: FSEntries) {
  const total = (rows: FSRow[]) => rows.reduce((sum, current) => sum + (parseFloat(current.amount) || 0), 0);
  const directExpense = total(entries.directExpense);
  const directIncome = total(entries.directIncome);
  const indirectExpense = total(entries.indirectExpense);
  const indirectIncome = total(entries.indirectIncome);
  const grossProfit = directIncome - directExpense;
  const netResult = grossProfit + indirectIncome - indirectExpense;

  return { directExpense, directIncome, indirectExpense, indirectIncome, grossProfit, netResult };
}

describe("Financial Statement Evaluation", () => {
  it("should score 100% when all sections match", () => {
    const fields = [
      makeField("pl_direct_expense_row1_account", "Administration Expenses", "f1", ["Administration Expenses", "Wages"]),
      makeField("pl_direct_expense_row1_amount", "12000", "f2"),
      makeField("pl_direct_income_row1_account", "Sales", "f3", ["Sales", "Closing Stock"]),
      makeField("pl_direct_income_row1_amount", "80000", "f4"),
      makeField("pl_indirect_expense_row1_account", "Salaries", "f5", ["Salaries"]),
      makeField("pl_indirect_expense_row1_amount", "15000", "f6"),
      makeField("pl_indirect_income_row1_account", "Discount Received", "f7", ["Discount Received"]),
      makeField("pl_indirect_income_row1_amount", "3000", "f8"),
      makeField("bs_capital_row1_account", "Capital Account", "f9", ["Capital Account"]),
      makeField("bs_capital_row1_amount", "100000", "f10"),
      makeField("bs_ncl_row1_account", "Long Term Loan", "f11", ["Long Term Loan"]),
      makeField("bs_ncl_row1_amount", "50000", "f12"),
      makeField("bs_cl_row1_account", "Creditors", "f13", ["Creditors"]),
      makeField("bs_cl_row1_amount", "12000", "f14"),
      makeField("bs_ppe_row1_account", "Plant and Machinery", "f15", ["Plant and Machinery"]),
      makeField("bs_ppe_row1_amount", "60000", "f16"),
      makeField("bs_onca_row1_account", "Goodwill", "f17", ["Goodwill"]),
      makeField("bs_onca_row1_amount", "15000", "f18"),
      makeField("bs_ca_row1_account", "Bank", "f19", ["Bank"]),
      makeField("bs_ca_row1_amount", "45000", "f20"),
    ];

    const entries: FSEntries = {
      directExpense: [row("Administration Expenses", "12000", 1)],
      directIncome: [row("Sales", "80000", 2)],
      indirectExpense: [row("Salaries", "15000", 3)],
      indirectIncome: [row("Discount Received", "3000", 4)],
      capital: [row("Capital Account", "100000", 5)],
      ncl: [row("Long Term Loan", "50000", 6)],
      cl: [row("Creditors", "12000", 7)],
      ppe: [row("Plant and Machinery", "60000", 8)],
      onca: [row("Goodwill", "15000", 9)],
      ca: [row("Bank", "45000", 10)],
    };

    const result = evaluate(fields, entries);

    assert.equal(result.accuracy, 100);
    assert.equal(result.totalScore, 10);
    assert.equal(result.maxPossibleScore, 10);
    assert.equal(result.sectionBreakdown?.length, 10);
    assert.ok(result.sectionBreakdown?.every((section) => section.accuracy === 100));
  });

  it("should score P&L section independently from Balance Sheet", () => {
    const fields = [
      makeField("pl_direct_expense_row1_account", "Administration Expenses", "f1"),
      makeField("pl_direct_expense_row1_amount", "12000", "f2"),
      makeField("pl_direct_income_row1_account", "Sales", "f3"),
      makeField("pl_direct_income_row1_amount", "80000", "f4"),
      makeField("pl_indirect_expense_row1_account", "Salaries", "f5"),
      makeField("pl_indirect_expense_row1_amount", "15000", "f6"),
      makeField("pl_indirect_income_row1_account", "Discount Received", "f7"),
      makeField("pl_indirect_income_row1_amount", "3000", "f8"),
      makeField("bs_capital_row1_account", "Capital Account", "f9"),
      makeField("bs_capital_row1_amount", "100000", "f10"),
      makeField("bs_ncl_row1_account", "Long Term Loan", "f11"),
      makeField("bs_ncl_row1_amount", "50000", "f12"),
      makeField("bs_cl_row1_account", "Creditors", "f13"),
      makeField("bs_cl_row1_amount", "12000", "f14"),
      makeField("bs_ppe_row1_account", "Plant and Machinery", "f15"),
      makeField("bs_ppe_row1_amount", "60000", "f16"),
      makeField("bs_onca_row1_account", "Goodwill", "f17"),
      makeField("bs_onca_row1_amount", "15000", "f18"),
      makeField("bs_ca_row1_account", "Bank", "f19"),
      makeField("bs_ca_row1_amount", "45000", "f20"),
    ];

    const entries: FSEntries = {
      directExpense: [row("Administration Expenses", "12000", 1)],
      directIncome: [row("Sales", "80000", 2)],
      indirectExpense: [row("Salaries", "15000", 3)],
      indirectIncome: [row("Discount Received", "3000", 4)],
      capital: [row("Wrong Capital", "1", 5)],
      ncl: [row("Wrong Loan", "1", 6)],
      cl: [row("Wrong Creditors", "1", 7)],
      ppe: [row("Wrong PPE", "1", 8)],
      onca: [row("Wrong Asset", "1", 9)],
      ca: [row("Wrong Bank", "1", 10)],
    };

    const result = evaluate(fields, entries);
    const bySection = new Map(result.sectionBreakdown?.map((section) => [section.section, section]));

    assert.equal(bySection.get("Direct Expense")?.accuracy, 100);
    assert.equal(bySection.get("Direct Income")?.accuracy, 100);
    assert.equal(bySection.get("Indirect Expense")?.accuracy, 100);
    assert.equal(bySection.get("Indirect Income")?.accuracy, 100);
    assert.equal(bySection.get("Capital")?.accuracy, 0);
    assert.equal(bySection.get("Ncl")?.accuracy, 0);
    assert.equal(bySection.get("Cl")?.accuracy, 0);
    assert.equal(bySection.get("Ppe")?.accuracy, 0);
    assert.equal(bySection.get("Onca")?.accuracy, 0);
    assert.equal(bySection.get("Ca")?.accuracy, 0);
    assert.equal(result.accuracy, 40);
  });

  it("should compute grossProfit correctly", () => {
    const entries: FSEntries = {
      directExpense: [row("Administration Expenses", "12000", 1)],
      directIncome: [row("Sales", "80000", 2)],
      indirectExpense: [row("Salaries", "15000", 3)],
      indirectIncome: [row("Discount Received", "3000", 4)],
      capital: [],
      ncl: [],
      cl: [],
      ppe: [],
      onca: [],
      ca: [],
    };

    const totals = statementTotals(entries);

    assert.equal(totals.grossProfit, 68000);
    assert.equal(totals.netResult, 56000);
  });

  it("should handle net loss scenario", () => {
    const fields = [
      makeField("pl_direct_expense_row1_account", "Administration Expenses", "f1"),
      makeField("pl_direct_expense_row1_amount", "12000", "f2"),
      makeField("pl_direct_income_row1_account", "Sales", "f3"),
      makeField("pl_direct_income_row1_amount", "10000", "f4"),
      makeField("pl_indirect_expense_row1_account", "Salaries", "f5"),
      makeField("pl_indirect_expense_row1_amount", "5000", "f6"),
      makeField("pl_indirect_income_row1_account", "Discount Received", "f7"),
      makeField("pl_indirect_income_row1_amount", "0", "f8"),
    ];

    const entries: FSEntries = {
      directExpense: [row("Administration Expenses", "12000", 1)],
      directIncome: [row("Sales", "10000", 2)],
      indirectExpense: [row("Salaries", "5000", 3)],
      indirectIncome: [row("Discount Received", "0", 4)],
      capital: [],
      ncl: [],
      cl: [],
      ppe: [],
      onca: [],
      ca: [],
    };

    const result = evaluate(fields, entries);
    const totals = statementTotals(entries);

    assert.equal(result.accuracy, 100);
    assert.equal(totals.grossProfit, -2000);
    assert.equal(totals.netResult, -7000);
  });

  it("should award partial credit for close account names", () => {
    const fields = [
      makeField("pl_direct_expense_row1_account", "Administration Expenses", "f1"),
      makeField("pl_direct_expense_row1_amount", "12000", "f2"),
    ];

    const entries: FSEntries = {
      directExpense: [row("Administration Expense", "12000", 1)],
      directIncome: [],
      indirectExpense: [],
      indirectIncome: [],
      capital: [],
      ncl: [],
      cl: [],
      ppe: [],
      onca: [],
      ca: [],
    };

    const result = evaluate(fields, entries);

    assert.equal(result.accuracy, 75);
    assert.equal(result.totalScore, 0.75);
    assert.equal(result.fieldBreakdown[0].status, "partial");
    assert.equal(result.fieldBreakdown[0].score, 0.75);
  });

  it("should submit blank values for expected financial statement fields", () => {
    const fields = [
      makeField("pl_direct_expense_row1_account", "Administration Expenses", "f1"),
      makeField("pl_direct_expense_row1_amount", "12000", "f2"),
      makeField("pl_direct_income_row1_account", "Sales", "f3"),
      makeField("pl_direct_income_row1_amount", "80000", "f4"),
    ];

    const entries: FSEntries = {
      directExpense: [{ id: 1, account: "", amount: "" }],
      directIncome: [{ id: 2, account: "", amount: "" }],
      indirectExpense: [],
      indirectIncome: [],
      capital: [],
      ncl: [],
      cl: [],
      ppe: [],
      onca: [],
      ca: [],
    };

    const answers = buildFSAttemptAnswers(fields, entries);

    assert.deepEqual(answers, [
      { field_id: "f1", entered_value: "" },
      { field_id: "f2", entered_value: "" },
      { field_id: "f3", entered_value: "" },
      { field_id: "f4", entered_value: "" },
    ]);
  });
});
