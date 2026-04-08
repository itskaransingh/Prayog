"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import type { ClassificationPayload } from "@/lib/simulation/answer-field-generator";
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

interface ClassificationRowState {
    label: string;
    expected: string;
}

const DEFAULT_ROWS: ClassificationRowState[] = Array.from({ length: 3 }, () => ({
    label: "",
    expected: "",
}));

function splitCommaList(value: string) {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function normalizeRows(rows: ClassificationRowState[]) {
    return rows.length > 0 ? rows : [{ label: "", expected: "" }];
}

function toPayload(
    optionsText: string,
    rows: ClassificationRowState[],
): ClassificationPayload {
    return {
        type: "classification",
        options: splitCommaList(optionsText),
        rows,
    };
}

export function ClassificationEditor({
    initialPayload,
    onChange,
    disabled = false,
}: QAEditorProps) {
    const startingPayload =
        initialPayload?.type === "classification" ? initialPayload : null;
    const [optionsText, setOptionsText] = useState(
        startingPayload?.options.join(", ") ?? "",
    );
    const [rows, setRows] = useState<ClassificationRowState[]>(
        startingPayload?.rows.length ? startingPayload.rows : DEFAULT_ROWS,
    );

    useEffect(() => {
        const nextPayload =
            initialPayload?.type === "classification" ? initialPayload : null;
        setOptionsText(nextPayload?.options.join(", ") ?? "");
        setRows(nextPayload?.rows.length ? nextPayload.rows : DEFAULT_ROWS);
    }, [initialPayload]);

    useEffect(() => {
        onChange(toPayload(optionsText, rows));
    }, [onChange, optionsText, rows]);

    const options = useMemo(() => splitCommaList(optionsText), [optionsText]);

    function updateRow(index: number, patch: Partial<ClassificationRowState>) {
        setRows((current) =>
            current.map((row, rowIndex) =>
                rowIndex === index ? { ...row, ...patch } : row,
            ),
        );
    }

    function addRow() {
        setRows((current) => [...current, { label: "", expected: "" }]);
    }

    function deleteRow(index: number) {
        setRows((current) => normalizeRows(current.filter((_, i) => i !== index)));
    }

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <div className="space-y-1">
                    <h3 className="text-sm font-medium">Classification Choices</h3>
                    <p className="text-sm text-muted-foreground">
                        Enter the shared dropdown choices as a comma-separated list.
                    </p>
                </div>
                <Input
                    value={optionsText}
                    onChange={(event) => setOptionsText(event.target.value)}
                    placeholder="Revenue, Capital, Asset, Liability, Expense"
                    disabled={disabled}
                />
                <div className="flex flex-wrap gap-2">
                    {options.length > 0 ? (
                        options.map((option) => (
                            <Badge key={option} variant="secondary">
                                {option}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-sm text-muted-foreground">
                            Choices will preview here as tags.
                        </span>
                    )}
                </div>
            </div>

            <Separator />

            <div className="space-y-4">
                <div className="grid grid-cols-[minmax(0,1fr)_180px_56px] gap-3 px-1 text-sm font-medium text-muted-foreground">
                    <div>Item / Transaction</div>
                    <div>Expected Answer</div>
                    <div />
                </div>

                <div className="space-y-3">
                    {rows.map((row, index) => (
                        <div
                            key={`classification-row-${index}`}
                            className="grid grid-cols-1 gap-3 rounded-2xl border border-border/60 bg-background/60 p-3 md:grid-cols-[minmax(0,1fr)_180px_56px]"
                        >
                            <Input
                                value={row.label}
                                onChange={(event) =>
                                    updateRow(index, { label: event.target.value })
                                }
                                placeholder={`Row ${index + 1} item`}
                                disabled={disabled}
                            />
                            <Select
                                value={row.expected}
                                onValueChange={(value) => updateRow(index, { expected: value })}
                                disabled={disabled || options.length === 0}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue
                                        placeholder={
                                            options.length > 0
                                                ? "Select answer"
                                                : "Add choices first"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
