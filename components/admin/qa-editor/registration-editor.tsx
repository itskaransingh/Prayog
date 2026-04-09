"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
    resolveRegistrationFieldDefinitions,
    type RegistrationPayload,
    type SimulationFieldDefinition,
} from "@/lib/simulation/answer-field-generator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import type { QAEditorProps } from "./types";

interface RegistrationRowState {
    fieldPath: string;
    fieldLabel: string;
    fieldGroup: string | null;
    helpText: string | null;
    expectedValue: string;
    included: boolean;
}

function createRows(
    definitions: SimulationFieldDefinition[],
    payload: RegistrationPayload | null,
): RegistrationRowState[] {
    const fieldMap = new Map(
        payload?.fields.map((field) => [field.fieldPath, field.expectedValue]) ?? [],
    );

    return definitions.map((definition) => {
        const expectedValue = fieldMap.get(definition.fieldName) ?? "";

        return {
            fieldPath: definition.fieldName,
            fieldLabel: definition.fieldLabel,
            fieldGroup: definition.fieldGroup,
            helpText: definition.helpText,
            expectedValue,
            included: fieldMap.has(definition.fieldName),
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

function getDefinitionsSignature(definitions: SimulationFieldDefinition[]): string {
    return JSON.stringify(
        definitions.map((definition) => ({
            fieldName: definition.fieldName,
            fieldLabel: definition.fieldLabel,
            fieldGroup: definition.fieldGroup,
            helpText: definition.helpText,
            sortOrder: definition.sortOrder,
            isActive: definition.isActive,
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
    const [fieldDefinitions, setFieldDefinitions] = useState<SimulationFieldDefinition[]>(
        () =>
            simulatorType === "itr_registration" || simulatorType === "epan_registration"
                ? resolveRegistrationFieldDefinitions(simulatorType)
                : [],
    );
    const [isLoadingDefinitions, setIsLoadingDefinitions] = useState(false);
    const [definitionsError, setDefinitionsError] = useState<string | null>(null);
    const [rows, setRows] = useState<RegistrationRowState[]>(
        createRows(fieldDefinitions, startingPayload),
    );
    const lastAppliedDefinitionsSignatureRef = useRef(
        getDefinitionsSignature(fieldDefinitions),
    );
    const lastIncomingSignatureRef = useRef(
        getPayloadSignature(startingPayload, simulatorType),
    );
    const lastEmittedSignatureRef = useRef<string | null>(null);

    useEffect(() => {
        if (
            simulatorType !== "itr_registration" &&
            simulatorType !== "epan_registration"
        ) {
            setFieldDefinitions([]);
            return;
        }

        const registrationSimulatorType = simulatorType;

        let cancelled = false;

        async function fetchDefinitions() {
            setIsLoadingDefinitions(true);
            setDefinitionsError(null);

            try {
                const response = await fetch(
                    `/api/admin/simulation-fields?simulatorType=${simulatorType}`,
                );
                const data = (await response.json()) as {
                    definitions?: SimulationFieldDefinition[];
                    error?: string;
                };

                if (!response.ok) {
                    throw new Error(
                        data.error || "Failed to load registration field definitions",
                    );
                }

                if (!cancelled) {
                    setFieldDefinitions(
                        resolveRegistrationFieldDefinitions(
                            registrationSimulatorType,
                            data.definitions ?? [],
                        ),
                    );
                }
            } catch (error: unknown) {
                if (!cancelled) {
                    setDefinitionsError(
                        error instanceof Error
                            ? error.message
                            : "Failed to load registration field definitions",
                    );
                    setFieldDefinitions(
                        resolveRegistrationFieldDefinitions(registrationSimulatorType),
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingDefinitions(false);
                }
            }
        }

        void fetchDefinitions();

        return () => {
            cancelled = true;
        };
    }, [simulatorType]);

    useEffect(() => {
        const nextIncomingSignature = getPayloadSignature(
            startingPayload,
            simulatorType,
        );
        const nextDefinitionsSignature = getDefinitionsSignature(fieldDefinitions);
        const incomingChanged =
            lastIncomingSignatureRef.current !== nextIncomingSignature;
        const definitionsChanged =
            lastAppliedDefinitionsSignatureRef.current !== nextDefinitionsSignature;

        if (!incomingChanged && !definitionsChanged) {
            return;
        }

        lastIncomingSignatureRef.current = nextIncomingSignature;
        lastAppliedDefinitionsSignatureRef.current = nextDefinitionsSignature;
        lastEmittedSignatureRef.current = null;
        setRows(createRows(fieldDefinitions, startingPayload));
    }, [fieldDefinitions, simulatorType, startingPayload]);

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
                    {definitionsError ? (
                        <p className="text-xs text-amber-600">
                            Metadata lookup failed, so the editor is using fallback field
                            definitions for now.
                        </p>
                    ) : null}
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

                {isLoadingDefinitions && rows.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                        Loading approved registration fields...
                    </div>
                ) : null}

                {rows.map((row, index) => (
                    <div
                        key={row.fieldPath}
                        className="grid grid-cols-1 gap-3 rounded-2xl border border-border/60 bg-background/60 p-3 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)_72px] md:items-center"
                    >
                        <div className="space-y-1">
                            <p className="text-sm font-medium">{row.fieldLabel}</p>
                            {row.fieldGroup ? (
                                <p className="text-xs text-muted-foreground">
                                    {row.fieldGroup}
                                </p>
                            ) : null}
                            <p className="text-xs text-muted-foreground">{row.fieldPath}</p>
                            {row.helpText ? (
                                <p className="text-xs text-muted-foreground">
                                    {row.helpText}
                                </p>
                            ) : null}
                        </div>
                        <Input
                            value={row.expectedValue}
                            onChange={(event) =>
                                updateRow(index, { expectedValue: event.target.value })
                            }
                            placeholder={`Expected ${row.fieldLabel}`}
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
