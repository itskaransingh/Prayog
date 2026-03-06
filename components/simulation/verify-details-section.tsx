"use client";

import { useState } from "react";
import { useRegistration } from "@/lib/simulation/registration-context";
import { evaluateRegistration } from "@/lib/evaluation";

interface VerifyDetailsSectionProps {
    onContinue: () => void;
    onBack: () => void;
}

export function VerifyDetailsSection({ onContinue, onBack }: VerifyDetailsSectionProps) {
    const { data, startTime } = useRegistration();
    const { personalDetails, contactDetails, addressDetails, pan, registerAs } = data;

    const [showEvaluationModal, setShowEvaluationModal] = useState(false);
    const [evaluationData, setEvaluationData] = useState<any>(null);

    const handleVerify = () => {
        // Trigger evaluation and show modal
        if (startTime) {
            const endTime = Date.now();
            const results = evaluateRegistration(data, startTime, endTime);
            setEvaluationData(results);
            setShowEvaluationModal(true);
        }
    };

    const handleContinueAfterEvaluation = () => {
        setShowEvaluationModal(false);
        onContinue();
    };

    const handleCloseEvaluation = () => {
        setShowEvaluationModal(false);
    };

    return (
        <div className="sim-form-card sim-form-card-full">
            <div className="sim-form-left">
                <h2 className="sim-form-title">Verify Your Details</h2>

                {/* Summary Section */}
                <div className="sim-verify-summary">
                    <div className="sim-summary-section">
                        <h3 className="sim-summary-section-title">Registration & PAN</h3>
                        <div className="sim-summary-grid">
                            <div className="sim-summary-item">
                                <span className="sim-summary-label">Register As</span>
                                <span className="sim-summary-value">{registerAs}</span>
                            </div>
                            <div className="sim-summary-item">
                                <span className="sim-summary-label">PAN</span>
                                <span className="sim-summary-value">{pan}</span>
                            </div>
                        </div>
                    </div>

                    <div className="sim-summary-section">
                        <h3 className="sim-summary-section-title">Personal Details</h3>
                        <div className="sim-summary-grid">
                            <div className="sim-summary-item">
                                <span className="sim-summary-label">First Name</span>
                                <span className="sim-summary-value">{personalDetails.firstName}</span>
                            </div>
                            <div className="sim-summary-item">
                                <span className="sim-summary-label">Middle Name</span>
                                <span className="sim-summary-value">{personalDetails.middleName || "—"}</span>
                            </div>
                            <div className="sim-summary-item">
                                <span className="sim-summary-label">Last Name</span>
                                <span className="sim-summary-value">{personalDetails.lastName}</span>
                            </div>
                            <div className="sim-summary-item">
                                <span className="sim-summary-label">Date of Birth</span>
                                <span className="sim-summary-value">{personalDetails.dob}</span>
                            </div>
                            <div className="sim-summary-item">
                                <span className="sim-summary-label">Gender</span>
                                <span className="sim-summary-value">{personalDetails.gender}</span>
                            </div>
                            <div className="sim-summary-item">
                                <span className="sim-summary-label">Residential Status</span>
                                <span className="sim-summary-value">{personalDetails.residentialStatus}</span>
                            </div>
                        </div>
                    </div>

                    <div className="sim-summary-section">
                        <h3 className="sim-summary-section-title">Address Details</h3>
                        <div className="sim-summary-grid">
                            <div className="sim-summary-item">
                                <span className="sim-summary-label">Flat/Door No.</span>
                                <span className="sim-summary-value">{addressDetails.flatDoorNo}</span>
                            </div>
                            <div className="sim-summary-item">
                                <span className="sim-summary-label">Building</span>
                                <span className="sim-summary-value">{addressDetails.building}</span>
                            </div>
                            <div className="sim-summary-item">
                                <span className="sim-summary-label">Road/Street</span>
                                <span className="sim-summary-value">{addressDetails.road}</span>
                            </div>
                            <div className="sim-summary-item">
                                <span className="sim-summary-label">Area/Locality</span>
                                <span className="sim-summary-value">{addressDetails.area}</span>
                            </div>
                            <div className="sim-summary-item">
                                <span className="sim-summary-label">City/Town</span>
                                <span className="sim-summary-value">{addressDetails.city}</span>
                            </div>
                            <div className="sim-summary-item">
                                <span className="sim-summary-label">State</span>
                                <span className="sim-summary-value">{addressDetails.state}</span>
                            </div>
                            <div className="sim-summary-item">
                                <span className="sim-summary-label">Pincode</span>
                                <span className="sim-summary-value">{addressDetails.pincode}</span>
                            </div>
                        </div>
                    </div>

                    <div className="sim-summary-section">
                        <h3 className="sim-summary-section-title">Contact Details</h3>
                        <div className="sim-summary-grid">
                            <div className="sim-summary-item">
                                <span className="sim-summary-label">Mobile Number</span>
                                <span className="sim-summary-value">{contactDetails.mobile}</span>
                            </div>
                            <div className="sim-summary-item">
                                <span className="sim-summary-label">Email ID</span>
                                <span className="sim-summary-value">{contactDetails.email}</span>
                            </div>
                            <div className="sim-summary-item">
                                <span className="sim-summary-label">Alt. Contact</span>
                                <span className="sim-summary-value">{contactDetails.alternateContact || "—"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sim-actions sim-actions-row">
                    <button type="button" className="sim-back-btn" onClick={onBack}>
                        &lsaquo; Back
                    </button>
                    <button
                        type="button"
                        className="sim-continue-btn enabled"
                        onClick={handleVerify}
                    >
                        Verify &rsaquo;
                    </button>
                </div>
            </div>

            {/* Evaluation Modal */}
            {showEvaluationModal && evaluationData && (
                <EvaluationModal
                    evaluation={evaluationData}
                    onContinue={handleContinueAfterEvaluation}
                    onClose={handleCloseEvaluation}
                />
            )}
        </div>
    );
}

interface EvaluationModalProps {
    evaluation: any;
    onContinue: () => void;
    onClose: () => void;
}

function EvaluationModal({ evaluation, onContinue, onClose }: EvaluationModalProps) {
    const { accuracy, totalScore, maxPossibleScore, fieldBreakdown, timeTakenSeconds } = evaluation;

    const minutes = Math.floor(timeTakenSeconds / 60);
    const seconds = timeTakenSeconds % 60;
    const timeDisplay = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    // SVG Circumference for 120px ring (r=50 -> 2*PI*50 = 314)
    const circumference = 314;
    const offset = circumference - (accuracy / 100) * circumference;

    return (
        <div className="sim-modal-overlay">
            <div className="sim-modal-content">
                <div className="sim-modal-header">
                    <h2 className="sim-modal-title">Evaluation Results</h2>
                    <button
                        type="button"
                        className="sim-modal-close"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                <div className="sim-modal-body">
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
                                <div className="sim-eval-stat-value">
                                    {totalScore} / {maxPossibleScore} Fields Correct
                                </div>
                            </div>
                            <div className="sim-eval-stat-item">
                                <div className="sim-eval-stat-label">Time Taken</div>
                                <div className="sim-eval-stat-value">{timeDisplay}</div>
                            </div>
                        </div>
                    </div>

                    <h3 className="sim-modal-section-title">Field Breakdown</h3>

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
                                {fieldBreakdown.map((item: any, idx: number) => (
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
                                                {item.status === "correct"
                                                    ? "✅"
                                                    : item.status === "partial"
                                                        ? "⚠️"
                                                        : "❌"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="sim-modal-footer">
                    <button
                        type="button"
                        className="sim-cancel-btn"
                        style={{ width: 'auto', padding: '10px 24px' }}
                        onClick={onClose}
                    >
                        Go Back & Fix
                    </button>
                    <button
                        type="button"
                        className="sim-continue-btn enabled"
                        style={{ width: 'auto', padding: '10px 24px' }}
                        onClick={onContinue}
                    >
                        Confirm & Proceed &rsaquo;
                    </button>
                </div>
            </div>
        </div>
    );
}
