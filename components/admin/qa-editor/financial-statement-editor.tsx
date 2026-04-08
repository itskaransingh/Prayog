"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Plus, Trash2 } from "lucide-react";

import type {
    FinancialStatementPayload,
    FinancialStatementSectionKey,
} from "@/lib/simulation/answer-field-generator";
import { sectionKeyToLabel } from "@/lib/simulation/answer-field-generator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type { QAEditorProps } from "./types";

interface FinancialStatementRowState {
    account: string;
    amount: string;
}

const FINANCIAL_STATEMENT_SECTIONS: FinancialStatementSectionKey[] = [
    "pl_direct_expense",
    "pl_direct_income",
    "pl_indirect_expense",
    "pl_indirect_income",
    "bs_capital",
    "bs_ncl",
    "bs_cl",
    "bs_ppe",
    "bs_onca",
    "bs_ca",
];

const EMPTY_ROW: FinancialStatementRowState = {
    account: "",
    amount: "",
};

function splitCommaList(value: string) {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function normalizeRows(rows: FinancialStatementRowState[]) {
    return rows.length > 0 ? rows : [{ ...EMPTY_ROW }];
}

function hasFilledRow(row: FinancialStatementRowState) {
    return row.account.trim() || row.amount.trim();
}

function createSections(
    payload: FinancialStatementPayload | null,
): Array<{
    sectionKey: FinancialStatementSectionKey;
    optionsText: string;
    rows: FinancialStatementRowState[];
}> {
    const sectionMap = new Map(
        payload?.sections.map((section) => [section.sectionKey, section]) ?? [],
    );

    return FINANCIAL_STATEMENT_SECTIONS.map((sectionKey) => {
        const section = sectionMap.get(sectionKey);

        return {
            sectionKey,
            optionsText: section?.options.join(", ") ?? "",
            rows: section?.rows.length ? section.rows : [{ ...EMPTY_ROW }],
        };
    });
}

function createExpandedState(
    sections: ReturnType<typeof createSections>,
) {
    return sections.reduce<Record<FinancialStatementSectionKey, boolean>>((acc, section) => {
        acc[section.sectionKey] = section.rows.some(hasFilledRow);
        return acc;
    }, {} as Record<FinancialStatementSectionKey, boolean>);
}

function toPayload(
    sections: ReturnType<typeof createSections>,
): FinancialStatementPayload {
    return {
        type: "financial_statement",
        sections: sections.map((section) => ({
            sectionKey: section.sectionKey,
            options: splitCommaList(section.optionsText),
            rows: section.rows.filter(hasFilledRow),
        })),
    };
}

export function FinancialStatementEditor({
    initialPayload,
    onChange,
    disabled = false,
}: QAEditorProps) {
    const startingPayload =
        initialPayload?.type === "financial_statement" ? initialPayload : null;
    const resetKey = JSON.stringify(startingPayload ?? null);

    return (
        <FinancialStatementEditorContent
            key={resetKey}
            payload={startingPayload}
            onChange={onChange}
            disabled={disabled}
        />
    );
}

function FinancialStatementEditorContent({
    payload,
    onChange,
    disabled,
}: {
    payload: FinancialStatementPayload | null;
    onChange: QAEditorProps["onChange"];
    disabled: boolean;
}) {
    const sections = createSections(payload);
    const [expandedSections, setExpandedSections] = useState<
        Record<FinancialStatementSectionKey, boolean>
    >(createExpandedState(sections));

    const sectionCounts = useMemo(
        () =>
            sections.reduce<Record<FinancialStatementSectionKey, number>>((acc, section) => {
                acc[section.sectionKey] = section.rows.filter(hasFilledRow).length;
                return acc;
            }, {} as Record<FinancialStatementSectionKey, number>),
        [sections],
    );

    function updateSections(nextSections: ReturnType<typeof createSections>) {
        onChange(toPayload(nextSections));
    }

    function setExpanded(sectionKey: FinancialStatementSectionKey, open: boolean) {
        setExpandedSections((current) => ({
            ...current,
            [sectionKey]: open,
        }));
    }

    function addRow(sectionKey: FinancialStatementSectionKey) {
        updateSections(
            sections.map((section) =>
                section.sectionKey === sectionKey
                    ? {
                          ...section,
                          rows: [...section.rows, { ...EMPTY_ROW }],
                      }
                    : section,
            ),
        );
        setExpanded(sectionKey, true);
    }

    function deleteRow(sectionKey: FinancialStatementSectionKey, index: number) {
        updateSections(
            sections.map((section) =>
                section.sectionKey === sectionKey
                    ? {
                          ...section,
                          rows: normalizeRows(
                              section.rows.filter((_, rowIndex) => rowIndex !== index),
                          ),
                      }
                    : section,
            ),
        );
    }

    return (
        <div className="space-y-4">
            {sections.map((section) => {
                const rowCount = sectionCounts[section.sectionKey] ?? 0;
                const isOpen = expandedSections[section.sectionKey] ?? false;

                return (
                    <Collapsible
                        key={section.sectionKey}
                        open={isOpen}
                        onOpenChange={(open) => setExpanded(section.sectionKey, open)}
                        className="rounded-2xl border border-border/60 bg-background/60"
                    >
                        <div className="flex items-center justify-between gap-3 p-4">
                            <CollapsibleTrigger asChild disabled={disabled}>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-auto flex-1 justify-start px-0 py-0 text-left hover:bg-transparent"
                                >
                                    <ChevronDown
                                        className={cn(
                                            "mr-2 h-4 w-4 transition-transform",
                                            isOpen ? "rotate-180" : "rotate-0",
                                        )}
                                    />
                                    <span className="text-sm font-semibold">
                                        {sectionKeyToLabel(section.sectionKey)}
                                    </span>
                                </Button>
                            </CollapsibleTrigger>
                            <Badge variant="secondary">{rowCount} rows</Badge>
                        </div>

                        <CollapsibleContent className="space-y-4 px-4 pb-4">
                            <Separator />

                            <div className="space-y-3 pt-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium">Section Options</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Enter section-specific account options as a
                                        comma-separated list.
                                    </p>
                                </div>
                                <Input
                                    value={section.optionsText}
                                    onChange={(event) =>
                                        updateSections(
                                            sections.map((currentSection) =>
                                                currentSection.sectionKey ===
                                                section.sectionKey
                                                    ? {
                                                          ...currentSection,
                                                          optionsText: event.target.value,
                                                      }
                                                    : currentSection,
                                            ),
                                        )
                                    }
                                    placeholder="Opening Stock, Purchases, Cash"
                                    disabled={disabled}
                                />
                                <div className="flex flex-wrap gap-2">
                                    {splitCommaList(section.optionsText).length > 0 ? (
                                        splitCommaList(section.optionsText).map((option) => (
                                            <Badge
                                                key={`${section.sectionKey}-${option}`}
                                                variant="outline"
                                            >
                                                {option}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm text-muted-foreground">
                                            Options for this section will preview here.
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="hidden grid-cols-[minmax(0,1fr)_180px_56px] gap-3 px-1 text-sm font-medium text-muted-foreground md:grid">
                                    <div>Account Name</div>
                                    <div>Amount</div>
                                    <div />
                                </div>

                                <div className="space-y-3">
                                    {section.rows.map((row, index) => (
                                        <div
                                            key={`${section.sectionKey}-row-${index}`}
                                            className="grid grid-cols-1 gap-3 rounded-2xl border border-border/60 bg-background p-3 md:grid-cols-[minmax(0,1fr)_180px_56px] md:items-center"
                                        >
                                            <Input
                                                value={row.account}
                                                onChange={(event) =>
                                                    updateSections(
                                                        sections.map((currentSection) =>
                                                            currentSection.sectionKey ===
                                                            section.sectionKey
                                                                ? {
                                                                      ...currentSection,
                                                                      rows: currentSection.rows.map(
                                                                          (
                                                                              currentRow,
                                                                              rowIndex,
                                                                          ) =>
                                                                              rowIndex === index
                                                                                  ? {
                                                                                        ...currentRow,
                                                                                        account:
                                                                                            event
                                                                                                .target
                                                                                                .value,
                                                                                    }
                                                                                  : currentRow,
                                                                      ),
                                                                  }
                                                                : currentSection,
                                                        )
                                                    )
                                                }
                                                placeholder={`Row ${index + 1} account`}
                                                disabled={disabled}
                                            />
                                            <Input
                                                value={row.amount}
                                                onChange={(event) =>
                                                    updateSections(
                                                        sections.map((currentSection) =>
                                                            currentSection.sectionKey ===
                                                            section.sectionKey
                                                                ? {
                                                                      ...currentSection,
                                                                      rows: currentSection.rows.map(
                                                                          (
                                                                              currentRow,
                                                                              rowIndex,
                                                                          ) =>
                                                                              rowIndex === index
                                                                                  ? {
                                                                                        ...currentRow,
                                                                                        amount:
                                                                                            event
                                                                                                .target
                                                                                                .value,
                                                                                    }
                                                                                  : currentRow,
                                                                      ),
                                                                  }
                                                                : currentSection,
                                                        )
                                                    )
                                                }
                                                inputMode="decimal"
                                                placeholder="0.00"
                                                disabled={disabled}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    deleteRow(section.sectionKey, index)
                                                }
                                                disabled={disabled || section.rows.length === 1}
                                                aria-label={`Delete row ${index + 1}`}
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
                                    onClick={() => addRow(section.sectionKey)}
                                    disabled={disabled}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Row
                                </Button>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                );
            })}
        </div>
    );
}
