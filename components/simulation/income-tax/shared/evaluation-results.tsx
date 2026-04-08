"use client";

import { RegistrationContext } from "@/lib/simulation/income-tax/itr-registration/registration-context";
import { type EvaluationResult, type FieldResult } from "@/lib/evaluation";
import { useContext } from "react";

type EvaluationPopupVariant = "default" | "grid" | "fs";

interface EvaluationPopupProps {
    open: boolean;
    onClose: () => void;
    results?: EvaluationResult | null;
    showExpectedValues?: boolean;
    variant?: EvaluationPopupVariant;
}

interface GridFieldBreakdownRow {
    amountType?: string;
    particular?: string;
    amount?: string;
    expectedParticular?: string;
    expectedAmount?: string;
    entered?: string;
    expected?: string;
}

interface FSFieldBreakdownRow {
    field?: string;
    entered?: string;
    expected?: string;
    status?: FieldResult["status"];
}

function getGridValue(value?: string) {
    if (value === undefined || value === null) return "(empty)";
    const trimmed = String(value).trim();
    return trimmed.length > 0 ? trimmed : "(empty)";
}

function splitFsDisplayValue(value?: string) {
    const trimmed = getGridValue(value);
    const [accountPart, amountPart] = trimmed.split("|");

    return {
        account: getGridValue(accountPart),
        amount: getGridValue(amountPart?.replace(/^₹\s*/, "")),
    };
}

function getFsSectionLabel(field?: string) {
    if (!field) return "(empty)";

    const match = field.match(/^(.*)\s+Row\s+\d+$/i);
    return match ? match[1] : field;
}

export function EvaluationPopup({
    open,
    onClose,
    results,
    showExpectedValues = true,
    variant = "default",
}: EvaluationPopupProps) {
    const itr = useContext(RegistrationContext);
    const evaluationResults = results || itr?.evaluationResults;

    if (!open || !evaluationResults) return null;

    const { accuracy, totalScore, maxPossibleScore, fieldBreakdown, timeTakenSeconds } = evaluationResults;

    const minutes = Math.floor(timeTakenSeconds / 60);
    const seconds = timeTakenSeconds % 60;
    const timeDisplay = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    // SVG Circumference for 120px ring (r=50 -> 2*PI*50 = 314)
    const circumference = 314;
    const offset = circumference - (accuracy / 100) * circumference;

    return (
        <div className="sim-eval-popup-overlay" onClick={onClose}>
            <div className="sim-eval-popup" onClick={(e) => e.stopPropagation()}>
                {/* Header with Prayog badge */}
                <div className="sim-eval-popup-header">
                    <h2 className="sim-eval-popup-title">Evaluation Details</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="sim-prayog-badge">
                            <span className="badge-emoji">🧪</span>
                            Brought to you by Prayog
                        </div>
                        <button className="sim-eval-popup-close" onClick={onClose}>
                            ✕
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="sim-eval-popup-body">
                    {/* Score Card */}
                    <div className="sim-eval-score-card">
                        <div className="sim-eval-ring-container">
                            <svg className="sim-eval-ring-svg" viewBox="0 0 120 120">
                                <circle
                                    className="sim-eval-ring-bg"
                                    cx="60"
                                    cy="60"
                                    r="50"
                                />
                                <circle
                                    className="sim-eval-ring-fill"
                                    cx="60"
                                    cy="60"
                                    r="50"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                />
                            </svg>
                            <div className="sim-eval-percentage">{accuracy}%</div>
                        </div>

                        <div className="sim-eval-stats">
                            <div className="sim-eval-stat-item">
                                <div className="sim-eval-stat-label">Accuracy Score</div>
                                <div className="sim-eval-stat-value">{totalScore} / {maxPossibleScore} Fields Correct</div>
                            </div>
                            <div className="sim-eval-stat-item">
                                <div className="sim-eval-stat-label">Time Taken</div>
                                <div className="sim-eval-stat-value">{timeDisplay}</div>
                            </div>
                        </div>
                    </div>

                    {/* Field Breakdown */}
                    <h3 className="sim-section-title" style={{ borderBottom: 'none', marginBottom: '12px' }}>
                        Field Breakdown
                    </h3>

                    <div className="sim-eval-breakdown">
                        <table className="sim-eval-table">
                            {variant === "grid" ? (
                                <>
                                    <thead>
                                        <tr>
                                            <th>Particular</th>
                                            <th>Dr/Cr</th>
                                            <th>Amount</th>
                                            <th>Expected Particular</th>
                                            <th>Expected Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fieldBreakdown.map((item: GridFieldBreakdownRow, idx: number) => (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: 500 }}>
                                                    {getGridValue(item.particular ?? item.entered)}
                                                </td>
                                                <td>
                                                    <span className="sim-eval-entered">
                                                        {getGridValue(item.amountType)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="sim-eval-entered">
                                                        {getGridValue(item.amount)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="sim-eval-expected">
                                                        {getGridValue(item.expectedParticular ?? item.expected)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="sim-eval-expected">
                                                        {getGridValue(item.expectedAmount)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            ) : variant === "fs" ? (
                                <>
                                    <thead>
                                        <tr>
                                            <th>Section</th>
                                            <th>Account</th>
                                            <th>Amount</th>
                                            <th>Expected Account</th>
                                            <th>Expected Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fieldBreakdown.map((item: FSFieldBreakdownRow, idx: number) => {
                                            const entered = splitFsDisplayValue(item.entered);
                                            const expected = splitFsDisplayValue(item.expected);

                                            return (
                                                <tr key={idx}>
                                                    <td style={{ fontWeight: 500 }}>
                                                        {getFsSectionLabel(item.field)}
                                                    </td>
                                                    <td>
                                                        <span className="sim-eval-entered">
                                                            {entered.account}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="sim-eval-entered">
                                                            {entered.amount}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="sim-eval-expected">
                                                            {expected.account}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="sim-eval-expected">
                                                            {expected.amount}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`sim-eval-status ${item.status ?? "incorrect"}`}>
                                                            {item.status === "correct" ? "✅" : item.status === "partial" ? "⚠️" : "❌"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </>
                            ) : (
                                <>
                                    <thead>
                                        <tr>
                                            <th>Field</th>
                                            <th>Entered</th>
                                            {showExpectedValues && <th>Expected</th>}
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fieldBreakdown.map((item: FieldResult, idx: number) => (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: 500 }}>{item.field}</td>
                                                <td>
                                                    <span className="sim-eval-entered">{item.entered}</span>
                                                </td>
                                                {showExpectedValues && (
                                                    <td>
                                                        <span className="sim-eval-expected">{item.expected}</span>
                                                    </td>
                                                )}
                                                <td>
                                                    <span className={`sim-eval-status ${item.status}`}>
                                                        {item.status === 'correct' ? '✅' : item.status === 'partial' ? '⚠️' : '❌'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </>
                            )}
                        </table>
                    </div>

                    {/* Action Button */}
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
                        <button 
                            className="sim-btn-filled big" 
                            style={{ width: '100%', padding: '12px', fontSize: '16px' }}
                            onClick={onClose}
                        >
                            Proceed to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
