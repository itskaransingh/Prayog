"use client";

import { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";

import type { TrialBalancePayload } from "@/lib/simulation/answer-field-generator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import type { QAEditorProps } from "./types";

interface TrialBalanceRowState {
    account: string;
    side: "debit" | "credit";
    amount: string;
}

const EMPTY_ROW: TrialBalanceRowState = {
    account: "",
    side: "debit",
    amount: "",
};

function splitCommaList(value: string) {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function normalizeRows(rows: TrialBalanceRowState[]) {
    return rows.length > 0 ? rows : [{ ...EMPTY_ROW }];
}

function toPayload(
    accountOptionsText: string,
    rows: TrialBalanceRowState[],
): TrialBalancePayload {
    return {
        type: "trial_balance",
        accountOptions: splitCommaList(accountOptionsText),
        rows: rows.filter((row) => row.account.trim() || row.amount.trim()),
    };
}

export function TrialBalanceEditor({
    initialPayload,
    onChange,
    disabled = false,
}: QAEditorProps) {
    const payload =
        initialPayload?.type === "trial_balance"
            ? initialPayload
            : toPayload("", [{ ...EMPTY_ROW }]);
    const accountOptionsText = payload.accountOptions.join(", ");
    const rows = payload.rows.length > 0 ? payload.rows : [{ ...EMPTY_ROW }];

    const accountOptions = useMemo(
        () => splitCommaList(accountOptionsText),
        [accountOptionsText],
    );

    function updateRows(nextRows: TrialBalanceRowState[]) {
        onChange(toPayload(accountOptionsText, nextRows));
    }

    function updateRow(index: number, patch: Partial<TrialBalanceRowState>) {
        updateRows(
            rows.map((row, rowIndex) =>
                rowIndex === index ? { ...row, ...patch } : row,
            ),
        );
    }

    function addRow() {
        updateRows([...rows, { ...EMPTY_ROW }]);
    }

    function deleteRow(index: number) {
        updateRows(normalizeRows(rows.filter((_, rowIndex) => rowIndex !== index)));
    }

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <div className="space-y-1">
                    <h3 className="text-sm font-medium">Account Options</h3>
                    <p className="text-sm text-muted-foreground">
                        Enter the available accounts for the trial balance dropdown as a
                        comma-separated list.
                    </p>
                </div>
                <Input
                    value={accountOptionsText}
                    onChange={(event) => onChange(toPayload(event.target.value, rows))}
                    placeholder="Cash, Capital, Purchases, Sales"
                    disabled={disabled}
                />
                <div className="flex flex-wrap gap-2">
                    {accountOptions.length > 0 ? (
                        accountOptions.map((option) => (
                            <Badge key={option} variant="secondary">
                                {option}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-sm text-muted-foreground">
                            Account options will preview here as tags.
                        </span>
                    )}
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <div className="hidden grid-cols-[minmax(0,1fr)_150px_160px_56px] gap-3 px-1 text-sm font-medium text-muted-foreground md:grid">
                    <div>Account Name</div>
                    <div>Side</div>
                    <div>Amount</div>
                    <div />
                </div>

                <div className="space-y-3">
                    {rows.map((row, index) => (
                        <div
                            key={`trial-balance-row-${index}`}
                            className="grid grid-cols-1 gap-3 rounded-2xl border border-border/60 bg-background/60 p-3 md:grid-cols-[minmax(0,1fr)_150px_160px_56px] md:items-center"
                        >
                            <Input
                                value={row.account}
                                onChange={(event) =>
                                    updateRow(index, { account: event.target.value })
                                }
                                placeholder={`Account ${index + 1}`}
                                disabled={disabled}
                            />
                            <Select
                                value={row.side}
                                onValueChange={(value) =>
                                    updateRow(index, {
                                        side: value as TrialBalanceRowState["side"],
                                    })
                                }
                                disabled={disabled}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select side" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="debit">Debit</SelectItem>
                                    <SelectItem value="credit">Credit</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                value={row.amount}
                                onChange={(event) =>
                                    updateRow(index, { amount: event.target.value })
                                }
                                inputMode="decimal"
                                placeholder="0.00"
                                disabled={disabled}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteRow(index)}
                                disabled={disabled || rows.length === 1}
                                aria-label={`Delete row ${index + 1}`}
                                className="h-9 w-9 self-center"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>

                <Button type="button" variant="outline" onClick={addRow} disabled={disabled}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Row
                </Button>
            </div>
        </div>
    );
}
