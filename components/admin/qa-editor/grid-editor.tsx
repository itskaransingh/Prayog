"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import type { GridPayload } from "@/lib/simulation/answer-field-generator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import type { QAEditorProps } from "./types";

interface GridRowState {
    transactionDesc: string;
    drAccount: string;
    drAmount: string;
    crAccount: string;
    crAmount: string;
}

const EMPTY_ROW: GridRowState = {
    transactionDesc: "",
    drAccount: "",
    drAmount: "",
    crAccount: "",
    crAmount: "",
};

function splitCommaList(value: string) {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function normalizeRows(rows: GridRowState[]) {
    return rows.length > 0 ? rows : [{ ...EMPTY_ROW }];
}

function toPayload(optionsText: string, rows: GridRowState[]): GridPayload {
    return {
        type: "grid",
        accountOptions: splitCommaList(optionsText),
        rows: rows.filter(
            (row) =>
                row.transactionDesc.trim() ||
                row.drAccount.trim() ||
                row.drAmount.trim() ||
                row.crAccount.trim() ||
                row.crAmount.trim(),
        ),
    };
}

function getPayloadSignature(payload: GridPayload | null): string {
    return JSON.stringify(payload ?? null);
}

export function GridEditor({
    initialPayload,
    onChange,
    disabled = false,
}: QAEditorProps) {
    const startingPayload =
        initialPayload?.type === "grid"
            ? initialPayload
            : null;
    const [accountOptionsText, setAccountOptionsText] = useState(
        startingPayload?.accountOptions.join(", ") ?? "",
    );
    const [rows, setRows] = useState<GridRowState[]>(
        startingPayload?.rows.length ? startingPayload.rows : [{ ...EMPTY_ROW }],
    );
    const lastIncomingSignatureRef = useRef(getPayloadSignature(startingPayload));
    const lastEmittedSignatureRef = useRef<string | null>(null);

    useEffect(() => {
        const nextPayload = initialPayload?.type === "grid" ? initialPayload : null;
        const nextSignature = getPayloadSignature(nextPayload);

        if (lastIncomingSignatureRef.current === nextSignature) {
            return;
        }

        lastIncomingSignatureRef.current = nextSignature;
        lastEmittedSignatureRef.current = null;
        setAccountOptionsText(nextPayload?.accountOptions.join(", ") ?? "");
        setRows(nextPayload?.rows.length ? nextPayload.rows : [{ ...EMPTY_ROW }]);
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

    const accountOptions = useMemo(
        () => splitCommaList(accountOptionsText),
        [accountOptionsText],
    );

    function updateRow(index: number, patch: Partial<GridRowState>) {
        setRows((current) =>
            current.map((row, rowIndex) =>
                rowIndex === index ? { ...row, ...patch } : row,
            ),
        );
    }

    function addRow() {
        setRows((current) => [...current, { ...EMPTY_ROW }]);
    }

    function deleteRow(index: number) {
        setRows((current) => normalizeRows(current.filter((_, rowIndex) => rowIndex !== index)));
    }

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <div className="space-y-1">
                    <h3 className="text-sm font-medium">Account Options</h3>
                    <p className="text-sm text-muted-foreground">
                        Enter shared account names for the simulator&apos;s autocomplete as a
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
                <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_140px_minmax(0,1fr)_140px_56px] gap-3 px-1 text-sm font-medium text-muted-foreground lg:grid">
                    <div>Transaction Description</div>
                    <div>Dr Account</div>
                    <div>Dr Amt</div>
                    <div>Cr Account</div>
                    <div>Cr Amt</div>
                    <div />
                </div>

                <div className="space-y-3">
                    {rows.map((row, index) => (
                        <div
                            key={`grid-row-${index}`}
                            className="grid grid-cols-1 gap-3 rounded-2xl border border-border/60 bg-background/60 p-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_140px_minmax(0,1fr)_140px_56px] lg:items-center"
                        >
                            <Input
                                value={row.transactionDesc}
                                onChange={(event) =>
                                    updateRow(index, {
                                        transactionDesc: event.target.value,
                                    })
                                }
                                placeholder={`Transaction ${index + 1}`}
                                disabled={disabled}
                            />
                            <Input
                                value={row.drAccount}
                                onChange={(event) =>
                                    updateRow(index, { drAccount: event.target.value })
                                }
                                placeholder="Debit account"
                                disabled={disabled}
                            />
                            <Input
                                value={row.drAmount}
                                onChange={(event) =>
                                    updateRow(index, { drAmount: event.target.value })
                                }
                                inputMode="decimal"
                                placeholder="0.00"
                                disabled={disabled}
                            />
                            <Input
                                value={row.crAccount}
                                onChange={(event) =>
                                    updateRow(index, { crAccount: event.target.value })
                                }
                                placeholder="Credit account"
                                disabled={disabled}
                            />
                            <Input
                                value={row.crAmount}
                                onChange={(event) =>
                                    updateRow(index, { crAmount: event.target.value })
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
