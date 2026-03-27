"use client";

import type { EPANConfirmSummary } from "./types";

interface EPANConfirmSubmitProps {
    summary: EPANConfirmSummary;
    onLogin: () => void;
    onViewEvaluation?: () => void;
}

export function EPANConfirmSubmit({
    summary,
    onLogin,
    onViewEvaluation,
}: EPANConfirmSubmitProps) {
    return (
        <div className="epan-confirm-page">
            <div className="epan-success-banner">
                <div className="epan-success-icon">✓</div>
                <div>
                    <h1>{summary.successMessage ?? "Your request for e-PAN has been submitted successfully"}</h1>
                    <p>
                        Acknowledgement Number for the same is {summary.acknowledgementNumber}. Please save the
                        Acknowledgement Number for future purposes to check the status or to download the e-PAN.
                        {summary.helperText ? ` ${summary.helperText}` : " The Acknowledgement Number has also been sent by SMS to the Mobile Number. You will receive e-PAN shortly."}
                    </p>
                </div>
            </div>

            <div className="epan-confirm-actions">
                {onViewEvaluation ? (
                    <button type="button" className="epan-btn epan-btn-secondary" onClick={onViewEvaluation}>
                        View Evaluation
                    </button>
                ) : null}
                <button type="button" className="epan-btn epan-btn-primary" onClick={onLogin}>
                    Go To Login <span aria-hidden="true">›</span>
                </button>
            </div>
        </div>
    );
}
