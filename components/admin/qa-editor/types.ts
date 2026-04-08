"use client";

import type { SyncAnswersPayload } from "@/lib/simulation/answer-field-generator";

export type SimulatorType =
    | "classification"
    | "itr_registration"
    | "epan_registration"
    | "journal_entry"
    | "ledger"
    | "trial_balance"
    | "financial_statement"
    | "none";

export interface QAEditorProps {
    simulatorType: SimulatorType;
    initialPayload: SyncAnswersPayload | null;
    onChange: (payload: SyncAnswersPayload | null) => void;
    disabled?: boolean;
}

export type { SyncAnswersPayload };
