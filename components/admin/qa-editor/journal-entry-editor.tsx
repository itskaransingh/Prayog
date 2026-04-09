"use client";
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import type { JournalEntryPayload } from "@/lib/simulation/answer-field-generator";
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

interface JournalLineState {
    side: "debit" | "credit";
    account: string;
    amount: string;
}

interface JournalRowState {
    transactionDesc: string;
    lines: JournalLineState[];
}

const EMPTY_LINE: JournalLineState = {
    side: "debit",
    account: "",
    amount: "",
};

const EMPTY_ROW: JournalRowState = {
    transactionDesc: "",
    lines: [{ ...EMPTY_LINE }, { ...EMPTY_LINE, side: "credit" }],
};

function splitCommaList(value: string) {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function normalizeLines(lines: JournalLineState[]) {
    return lines.length > 0 ? lines : [{ ...EMPTY_LINE }];
}

function normalizeRows(rows: JournalRowState[]) {
    return rows.length > 0 ? rows : [{ ...EMPTY_ROW }];
}

function toPayload(
    accountOptionsText: string,
    rows: JournalRowState[],
): JournalEntryPayload {
    return {
        type: "journal_entry",
        accountOptions: splitCommaList(accountOptionsText),
        rows: rows
            .map((row) => ({
                transactionDesc: row.transactionDesc,
                lines: row.lines.filter(
                    (line) => line.account.trim() || line.amount.trim(),
                ),
            }))
            .filter((row) => row.transactionDesc.trim() || row.lines.length > 0),
    };
}

function getPayloadSignature(payload: JournalEntryPayload | null): string {
    return JSON.stringify(payload ?? null);
}

export function JournalEntryEditor({
    initialPayload,
    onChange,
    disabled = false,
}: QAEditorProps) {
    const startingPayload =
        initialPayload?.type === "journal_entry"
            ? initialPayload
            : null;
    const [accountOptionsText, setAccountOptionsText] = useState(
        startingPayload?.accountOptions.join(", ") ?? "",
    );
    const [rows, setRows] = useState<JournalRowState[]>(
        startingPayload?.rows.length
            ? startingPayload.rows.map((row) => ({
                  transactionDesc: row.transactionDesc,
                  lines: row.lines.length > 0 ? row.lines : [{ ...EMPTY_LINE }],
              }))
            : [{ ...EMPTY_ROW }],
    );
    const lastIncomingSignatureRef = useRef(getPayloadSignature(startingPayload));
    const lastEmittedSignatureRef = useRef<string | null>(null);

    useEffect(() => {
        const nextPayload =
            initialPayload?.type === "journal_entry" ? initialPayload : null;
        const nextSignature = getPayloadSignature(nextPayload);

        if (lastIncomingSignatureRef.current === nextSignature) {
            return;
        }

        lastIncomingSignatureRef.current = nextSignature;
        lastEmittedSignatureRef.current = null;
        setAccountOptionsText(nextPayload?.accountOptions.join(", ") ?? "");
        setRows(
            nextPayload?.rows.length
                ? nextPayload.rows.map((row) => ({
                      transactionDesc: row.transactionDesc,
                      lines: row.lines.length > 0 ? row.lines : [{ ...EMPTY_LINE }],
                  }))
                : [{ ...EMPTY_ROW }],
        );
    }, [initialPayload]);

    useEffect(() => {
        const nextPayload = toPayload(accountOptionsText, rows);
        const nextSignature = getPayloadSignature(nextPayload);

        if (lastEmittedSignatureRef.current === nextSignature) {
            return;
        }

        lastEmittedSignatureRef.current = nextSignature;
        lastIncomingSignatureRef.current = nextSignature;
        onChange(nextPayload);
    }, [accountOptionsText, onChange, rows]);

    const accountOptions = splitCommaList(accountOptionsText);

    function updateTransaction(index: number, patch: Partial<JournalRowState>) {
        setRows((current) =>
            current.map((row, rowIndex) =>
                rowIndex === index ? { ...row, ...patch } : row,
            ),
        );
    }

    function updateLine(
        rowIndex: number,
        lineIndex: number,
        patch: Partial<JournalLineState>,
    ) {
        setRows((current) =>
            current.map((row, currentRowIndex) =>
                currentRowIndex !== rowIndex
                    ? row
                    : {
                          ...row,
                          lines: row.lines.map((line, currentLineIndex) =>
                              currentLineIndex === lineIndex
                                  ? { ...line, ...patch }
                                  : line,
                          ),
                      },
            ),
        );
    }

    function addTransaction() {
        setRows((current) => [
            ...current,
            { ...EMPTY_ROW, lines: EMPTY_ROW.lines.map((line) => ({ ...line })) },
        ]);
    }

    function deleteTransaction(index: number) {
        setRows((current) => normalizeRows(current.filter((_, rowIndex) => rowIndex !== index)));
    }

    function addLine(rowIndex: number) {
        setRows((current) =>
            current.map((row, currentRowIndex) =>
                currentRowIndex === rowIndex
                    ? { ...row, lines: [...row.lines, { ...EMPTY_LINE }] }
                    : row,
            ),
        );
    }

    function deleteLine(rowIndex: number, lineIndex: number) {
        setRows((current) =>
            current.map((row, currentRowIndex) =>
                currentRowIndex !== rowIndex
                    ? row
                    : {
                          ...row,
                          lines: normalizeLines(
                              row.lines.filter((_, currentLineIndex) => currentLineIndex !== lineIndex),
                          ),
                      },
            ),
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <div className="space-y-1">
                    <h3 className="text-sm font-medium">Account Options</h3>
                    <p className="text-sm text-muted-foreground">
                        Enter shared account names for journal-entry autocomplete as a
                        comma-separated list.
                    </p>
                </div>
                <Input
                    value={accountOptionsText}
                    onChange={(event) => setAccountOptionsText(event.target.value)}
                    placeholder="Cash, Capital, Sales, Debtors"
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
                            Shared account options will preview here.
                        </span>
                    )}
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                {rows.map((row, rowIndex) => (
                    <div
                        key={`journal-row-${rowIndex}`}
                        className="space-y-4 rounded-2xl border border-border/60 bg-background/60 p-4"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <Input
                                value={row.transactionDesc}
                                onChange={(event) =>
                                    updateTransaction(rowIndex, {
                                        transactionDesc: event.target.value,
                                    })
                                }
                                placeholder={`Transaction ${rowIndex + 1}`}
                                disabled={disabled}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteTransaction(rowIndex)}
                                disabled={disabled || rows.length === 1}
                                aria-label={`Delete transaction ${rowIndex + 1}`}
                                className="h-9 w-9 flex-none"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {row.lines.map((line, lineIndex) => (
                                <div
                                    key={`journal-row-${rowIndex}-line-${lineIndex}`}
                                    className="grid grid-cols-1 gap-3 rounded-2xl border border-border/50 bg-background p-3 md:grid-cols-[140px_minmax(0,1fr)_160px_56px] md:items-center"
                                >
                                    <Select
                                        value={line.side}
                                        onValueChange={(value) =>
                                            updateLine(rowIndex, lineIndex, {
                                                side: value as JournalLineState["side"],
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
                                        value={line.account}
                                        onChange={(event) =>
                                            updateLine(rowIndex, lineIndex, {
                                                account: event.target.value,
                                            })
                                        }
                                        placeholder="Account"
                                        disabled={disabled}
                                    />
                                    <Input
                                        value={line.amount}
                                        onChange={(event) =>
                                            updateLine(rowIndex, lineIndex, {
                                                amount: event.target.value,
                                            })
                                        }
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        disabled={disabled}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteLine(rowIndex, lineIndex)}
                                        disabled={disabled || row.lines.length === 1}
                                        aria-label={`Delete line ${lineIndex + 1} for transaction ${rowIndex + 1}`}
                                        className="h-9 w-9 self-center"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => addLine(rowIndex)}
                            disabled={disabled}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Line
                        </Button>
                    </div>
                ))}

                <Button type="button" variant="outline" onClick={addTransaction} disabled={disabled}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Transaction
                </Button>
            </div>
        </div>
    );
}
