"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import type { GstfSimulationPayload } from "@/lib/simulation/answer-field-generator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { QAEditorProps } from "./types";

interface GstfFieldRowState {
    label: string;
    value: string;
}

const EMPTY_ROW: GstfFieldRowState = {
    label: "",
    value: "",
};

function normalizeRows(rows: GstfFieldRowState[]) {
    return rows.length > 0 ? rows : [{ ...EMPTY_ROW }];
}

function toPayload(rows: GstfFieldRowState[]): GstfSimulationPayload {
    return {
        type: "gstf-simulation",
        fields: rows,
    };
}

export function GstfSimulationEditor({
    initialPayload,
    onChange,
    disabled = false,
}: QAEditorProps) {
    const startingPayload =
        initialPayload?.type === "gstf-simulation" ? initialPayload : null;
    const [rows, setRows] = useState<GstfFieldRowState[]>(
        startingPayload?.fields.length ? startingPayload.fields : [{ ...EMPTY_ROW }],
    );

    useEffect(() => {
        const nextPayload =
            initialPayload?.type === "gstf-simulation" ? initialPayload : null;
        setRows(
            nextPayload?.fields.length ? nextPayload.fields : [{ ...EMPTY_ROW }],
        );
    }, [initialPayload]);

    useEffect(() => {
        onChange(toPayload(rows));
    }, [onChange, rows]);

    function updateRow(index: number, patch: Partial<GstfFieldRowState>) {
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
        setRows((current) => normalizeRows(current.filter((_, i) => i !== index)));
    }

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <h3 className="text-sm font-medium">GSTF Answer Builder</h3>
                <p className="text-sm text-muted-foreground">
                    Type each field label yourself, then add the expected field value beside it.
                </p>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_56px] gap-3 px-1 text-sm font-medium text-muted-foreground">
                <div>Field Label</div>
                <div>Field Value</div>
                <div />
            </div>

            <div className="space-y-3">
                {rows.map((row, index) => (
                    <div
                        key={`gstf-row-${index}`}
                        className="grid grid-cols-1 gap-3 rounded-2xl border border-border/60 bg-background/60 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_56px]"
                    >
                        <Input
                            value={row.label}
                            onChange={(event) =>
                                updateRow(index, { label: event.target.value })
                            }
                            placeholder={`Field ${index + 1} label`}
                            disabled={disabled}
                        />
                        <Input
                            value={row.value}
                            onChange={(event) =>
                                updateRow(index, { value: event.target.value })
                            }
                            placeholder="Expected value"
                            disabled={disabled}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteRow(index)}
                            disabled={disabled || rows.length === 1}
                            aria-label={`Delete GSTF field ${index + 1}`}
                            className="h-9 w-9 self-center"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>

            <Button type="button" variant="outline" onClick={addRow} disabled={disabled}>
                <Plus className="mr-2 h-4 w-4" />
                Add Field
            </Button>
        </div>
    );
}
