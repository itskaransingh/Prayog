"use client";

import { useRegistration } from "@/lib/simulation/registration-context";

interface EvaluationPopupProps {
    open: boolean;
    onClose: () => void;
}

export function EvaluationPopup({ open, onClose }: EvaluationPopupProps) {
    const { evaluationResults } = useRegistration();

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
                            <thead>
                                <tr>
                                    <th>Field</th>
                                    <th>Entered</th>
                                    <th>Expected</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fieldBreakdown.map((item, idx) => (
                                    <tr key={idx}>
                                        <td style={{ fontWeight: 500 }}>{item.field}</td>
                                        <td>
                                            <span className="sim-eval-entered">{item.entered}</span>
                                        </td>
                                        <td>
                                            <span className="sim-eval-expected">{item.expected}</span>
                                        </td>
                                        <td>
                                            <span className={`sim-eval-status ${item.status}`}>
                                                {item.status === 'correct' ? '✅' : item.status === 'partial' ? '⚠️' : '❌'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
