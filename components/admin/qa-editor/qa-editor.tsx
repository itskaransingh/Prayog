"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";

import { Separator } from "@/components/ui/separator";

import { ClassificationEditor } from "./classification-editor";
import { FinancialStatementEditor } from "./financial-statement-editor";
import { JournalEntryEditor } from "./journal-entry-editor";
import { LedgerEditor } from "./ledger-editor";
import { RegistrationEditor } from "./registration-editor";
import { TrialBalanceEditor } from "./trial-balance-editor";
import type { QAEditorProps } from "./types";

function Notice({
    title,
    description,
}: {
    title: string;
    description: ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-5">
            <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="space-y-1">
                    <p className="text-sm font-medium">{title}</p>
                    <div className="text-sm text-muted-foreground">{description}</div>
                </div>
            </div>
            <Separator className="mt-4" />
        </div>
    );
}

function NoneNotice() {
    return (
        <Notice
            title="Simulator Type Required"
            description={
                <>
                    This submodule has no simulator type configured. Set{" "}
                    <Link
                        href="/dashboard/admin/content/modules"
                        className="font-medium text-foreground underline underline-offset-2"
                    >
                        simulator_type on the submodule first
                    </Link>
                    .
                </>
            }
        />
    );
}

export function QAEditor(props: QAEditorProps) {
    switch (props.simulatorType) {
        case "classification":
            return <ClassificationEditor {...props} />;
        case "itr_registration":
        case "epan_registration":
            return <RegistrationEditor {...props} />;
        case "journal_entry":
            return <JournalEntryEditor {...props} />;
        case "ledger":
            return <LedgerEditor {...props} />;
        case "trial_balance":
            return <TrialBalanceEditor {...props} />;
        case "financial_statement":
            return <FinancialStatementEditor {...props} />;
        case "none":
        default:
            return <NoneNotice />;
    }
}
