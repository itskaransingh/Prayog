"use client";

import { AlertCircle } from "lucide-react";

import { Separator } from "@/components/ui/separator";

import { ClassificationEditor } from "./classification-editor";
import { FinancialStatementEditor } from "./financial-statement-editor";
import { GridEditor } from "./grid-editor";
import { RegistrationEditor } from "./registration-editor";
import { TrialBalanceEditor } from "./trial-balance-editor";
import type { QAEditorProps } from "./types";

function Notice({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-5">
            <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="space-y-1">
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
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
            description="This submodule has no simulator type configured. Set simulator_type on the submodule first."
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
        case "ledger":
            return <GridEditor {...props} />;
        case "trial_balance":
            return <TrialBalanceEditor {...props} />;
        case "financial_statement":
            return <FinancialStatementEditor {...props} />;
        case "none":
        default:
            return <NoneNotice />;
    }
}
