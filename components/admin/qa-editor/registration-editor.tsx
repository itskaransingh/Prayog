"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { RegistrationPayload } from "@/lib/simulation/answer-field-generator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import type { QAEditorProps } from "./types";

const ITR_FIELD_PATHS = [
    "registerAs",
    "pan",
    "personalDetails.firstName",
    "personalDetails.middleName",
    "personalDetails.lastName",
    "personalDetails.dob",
    "personalDetails.gender",
    "personalDetails.residentialStatus",
    "addressDetails.flatDoorNo",
    "addressDetails.road",
    "addressDetails.area",
    "addressDetails.postOffice",
    "addressDetails.city",
    "addressDetails.state",
    "addressDetails.pincode",
    "contactDetails.mobile",
    "contactDetails.email",
    "contactDetails.alternateContact",
    "contactDetails.mobileBelongsTo",
    "contactDetails.emailBelongsTo",
] as const;

const EPAN_FIELD_PATHS = [
    "fullName",
    "dob",
    "gender",
    "mobile",
    "email",
    "address",
    "aadhaarNumber",
] as const;

interface RegistrationRowState {
    fieldPath: string;
    expectedValue: string;
    included: boolean;
}

function fieldPathToLabel(fieldPath: string) {
    const lastSegment = fieldPath.split(".").at(-1) ?? fieldPath;
    return lastSegment
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/^./, (character) => character.toUpperCase());
}

function getFieldPaths(simulatorType: QAEditorProps["simulatorType"]) {
    if (simulatorType === "itr_registration") {
        return [...ITR_FIELD_PATHS];
    }

    return [...EPAN_FIELD_PATHS];
}

function createRows(
    simulatorType: QAEditorProps["simulatorType"],
    payload: RegistrationPayload | null,
): RegistrationRowState[] {
    const fieldMap = new Map(
        payload?.fields.map((field) => [field.fieldPath, field.expectedValue]) ?? [],
    );

    return getFieldPaths(simulatorType).map((fieldPath) => {
        const expectedValue = fieldMap.get(fieldPath) ?? "";

        return {
            fieldPath,
            expectedValue,
            included: fieldMap.has(fieldPath),
        };
    });
}

function toPayload(rows: RegistrationRowState[]): RegistrationPayload {
    return {
        type: "registration",
        fields: rows
            .filter((row) => row.included)
            .map((row) => ({
                fieldPath: row.fieldPath,
                expectedValue: row.expectedValue,
            })),
    };
}

function getPayloadSignature(
    payload: RegistrationPayload | null,
    simulatorType: QAEditorProps["simulatorType"],
): string {
    return JSON.stringify({
        simulatorType,
        fields:
            payload?.fields.map((field) => ({
                fieldPath: field.fieldPath,
                expectedValue: field.expectedValue,
            })) ?? [],
    });
}

function getRowsSignature(rows: RegistrationRowState[]): string {
    return JSON.stringify(
        rows.map((row) => ({
            fieldPath: row.fieldPath,
            expectedValue: row.expectedValue,
            included: row.included,
        })),
    );
}

export function RegistrationEditor({
    simulatorType,
    initialPayload,
    onChange,
    disabled = false,
}: QAEditorProps) {
    const startingPayload =
        initialPayload?.type === "registration" ? initialPayload : null;
    const [rows, setRows] = useState<RegistrationRowState[]>(
        createRows(simulatorType, startingPayload),
    );
    const lastIncomingSignatureRef = useRef(
        getPayloadSignature(startingPayload, simulatorType),
    );
    const lastEmittedSignatureRef = useRef<string | null>(null);

    useEffect(() => {
        const nextPayload = toPayload(rows);
        const nextSignature = getRowsSignature(rows);

        if (lastEmittedSignatureRef.current === nextSignature) {
            return;
        }

        lastEmittedSignatureRef.current = nextSignature;
        lastIncomingSignatureRef.current = getPayloadSignature(
            nextPayload,
            simulatorType,
        );
        onChange(nextPayload);
    }, [onChange, rows, simulatorType]);

    const includedCount = useMemo(
        () => rows.filter((row) => row.included).length,
        [rows],
    );

    function updateRow(index: number, patch: Partial<RegistrationRowState>) {
        setRows((current) =>
            current.map((row, rowIndex) =>
                rowIndex === index ? { ...row, ...patch } : row,
            ),
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <h3 className="text-sm font-medium">Registration Checks</h3>
                    <p className="text-sm text-muted-foreground">
                        Choose which fields should be evaluated and provide their expected
                        values.
                    </p>
                </div>
                <Badge variant="secondary">{includedCount} included</Badge>
            </div>

            <Separator />

            <div className="space-y-3">
                <div className="hidden grid-cols-[minmax(0,240px)_minmax(0,1fr)_72px] gap-3 px-1 text-sm font-medium text-muted-foreground md:grid">
                    <div>Field</div>
                    <div>Expected Value</div>
                    <div>Include</div>
                </div>

                {rows.map((row, index) => (
                    <div
                        key={row.fieldPath}
                        className="grid grid-cols-1 gap-3 rounded-2xl border border-border/60 bg-background/60 p-3 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)_72px] md:items-center"
                    >
                        <div className="space-y-1">
                            <p className="text-sm font-medium">{fieldPathToLabel(row.fieldPath)}</p>
                            <p className="text-xs text-muted-foreground">{row.fieldPath}</p>
                        </div>
                        <Input
                            value={row.expectedValue}
                            onChange={(event) =>
                                updateRow(index, { expectedValue: event.target.value })
                            }
                            placeholder={`Expected ${fieldPathToLabel(row.fieldPath)}`}
                            disabled={disabled || !row.included}
                        />
                        <label className="flex items-center gap-2 text-sm font-medium md:justify-center">
                            <input
                                type="checkbox"
                                checked={row.included}
                                onChange={(event) =>
                                    updateRow(index, { included: event.target.checked })
                                }
                                disabled={disabled}
                                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                            />
                            <span className="md:sr-only">Include {row.fieldPath}</span>
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
}
