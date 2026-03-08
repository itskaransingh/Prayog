"use client";

import { useRegistration } from "@/lib/simulation/registration-context";

interface VerifyDetailsSectionProps {
    onContinue: () => void;
    onBack: () => void;
}

export function VerifyDetailsSection({ onContinue, onBack }: VerifyDetailsSectionProps) {
    const { data, goToStep } = useRegistration();
    const { personalDetails, contactDetails, addressDetails, pan } = data;

    const fullName = `${personalDetails.firstName}${personalDetails.middleName ? " " + personalDetails.middleName : ""} ${personalDetails.lastName}`.trim();

    return (
        <div className="sim-verify-container">
            <div className="sim-verify-header-info">
                <p className="sim-registering-as">Registering as - <strong>Individual</strong></p>
                <h2 className="sim-verify-page-title">Verify Details</h2>
                <p className="sim-verify-subtitle">Please review if the information is correct & modify your details if needed.</p>
            </div>

            <div className="sim-verify-cards">
                {/* Basic Details Card */}
                <div className="sim-verify-card">
                    <div className="sim-verify-card-header">
                        <h3 className="sim-verify-card-title">Basic Details</h3>
                        <button className="sim-edit-btn" onClick={() => goToStep(2)}>
                            <svg className="sim-edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit
                        </button>
                    </div>

                    <div className="sim-verify-divider"></div>

                    <div className="sim-verify-grid">
                        <div className="sim-verify-item">
                            <span className="sim-verify-label">PAN</span>
                            <span className="sim-verify-value">{pan}</span>
                        </div>
                        <div className="sim-verify-item">
                            <span className="sim-verify-label">Name</span>
                            <span className="sim-verify-value">{personalDetails.lastName}</span>
                        </div>
                        <div className="sim-verify-item">
                            <span className="sim-verify-label">Date of Birth</span>
                            <span className="sim-verify-value">{personalDetails.dob}</span>
                        </div>
                        <div className="sim-verify-item">
                            <span className="sim-verify-label">Gender</span>
                            <span className="sim-verify-value">{personalDetails.gender}</span>
                        </div>
                        <div className="sim-verify-item">
                            <span className="sim-verify-label">Residential Status</span>
                            <span className="sim-verify-value">{personalDetails.residentialStatus}</span>
                        </div>
                    </div>

                    <p className="sim-verify-note"><strong>Note:</strong> You can only edit &ldquo;Residential Status&rdquo;</p>
                </div>

                {/* Contact Details Card */}
                <div className="sim-verify-card">
                    <div className="sim-verify-card-header">
                        <div className="sim-verify-card-title-group">
                            <h3 className="sim-verify-card-title">Contact Details</h3>
                            <p className="sim-verify-card-subtitle">Details furnished here will be used for communication purposes</p>
                        </div>
                        <button className="sim-edit-btn" onClick={() => goToStep(2)}>
                            <svg className="sim-edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit
                        </button>
                    </div>

                    <div className="sim-verify-divider"></div>

                    <div className="sim-verify-grid-contact">
                        <div className="sim-verify-item">
                            <span className="sim-verify-label">Primary Mobile Number</span>
                            <div className="sim-verify-value-group">
                                <span className="sim-verify-value">+91 {contactDetails.mobile}</span>
                                <span className="sim-verify-subvalue">({contactDetails.mobileBelongsTo})</span>
                            </div>
                        </div>
                        <div className="sim-verify-item">
                            <span className="sim-verify-label">Primary Email ID</span>
                            <div className="sim-verify-value-group">
                                <span className="sim-verify-value">{contactDetails.email}</span>
                                <span className="sim-verify-subvalue">({contactDetails.emailBelongsTo})</span>
                            </div>
                        </div>
                        <div className="sim-verify-item">
                            <span className="sim-verify-label">Landline</span>
                            <span className="sim-verify-value">{contactDetails.alternateContact || "—"}</span>
                        </div>
                        <div className="sim-verify-item">
                            <span className="sim-verify-label">Postal Address</span>
                            <div className="sim-verify-address-block">
                                <p>{addressDetails.flatDoorNo} {addressDetails.road} {addressDetails.area}</p>
                                <p>{addressDetails.postOffice} {addressDetails.city} {addressDetails.state} India</p>
                                <p>Pincode - {addressDetails.pincode}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="sim-verify-actions">
                <button type="button" className="sim-back-border-btn" onClick={onBack}>
                    &#8249; Back
                </button>
                <button
                    type="button"
                    className="sim-confirm-btn"
                    onClick={onContinue}
                >
                    Confirm
                </button>
            </div>

            {/* Injected Styles to match screenshot precisely since they are missing in simulation.css */}
            <style jsx>{`
                .sim-verify-container {
                    padding: 0 0 20px;
                }
                .sim-registering-as {
                    font-size: 14px;
                    color: #333;
                    margin-bottom: 20px;
                }
                .sim-verify-page-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #333;
                    margin-bottom: 8px;
                }
                .sim-verify-subtitle {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 30px;
                }
                .sim-verify-cards {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                .sim-verify-card {
                    background: #fff;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 30px 40px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                }
                .sim-verify-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 20px;
                }
                .sim-verify-card-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1b3281;
                }
                .sim-verify-card-subtitle {
                    font-size: 13px;
                    color: #666;
                    margin-top: 4px;
                }
                .sim-edit-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    border: 1px solid #007bff;
                    border-radius: 4px;
                    background: #fff;
                    color: #007bff;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .sim-edit-btn:hover {
                    background: #f0f7ff;
                }
                .sim-edit-icon {
                    width: 14px;
                    height: 14px;
                }
                .sim-verify-divider {
                    height: 1px;
                    background: #eee;
                    margin: 0 -40px 24px;
                }
                .sim-verify-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 24px;
                    margin-bottom: 24px;
                }
                .sim-verify-grid-contact {
                    display: grid;
                    grid-template-columns: 1fr 1fr 0.8fr 1.5fr;
                    gap: 24px;
                }
                .sim-verify-item {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .sim-verify-label {
                    font-size: 13px;
                    color: #666;
                    font-weight: 400;
                }
                .sim-verify-value {
                    font-size: 14px;
                    color: #111;
                    font-weight: 700;
                }
                .sim-verify-subvalue {
                    font-size: 13px;
                    color: #666;
                    font-weight: 400;
                }
                .sim-verify-value-group {
                    display: flex;
                    flex-direction: column;
                }
                .sim-verify-address-block p {
                    font-size: 14px;
                    color: #111;
                    font-weight: 700;
                    margin: 0;
                    line-height: 1.4;
                }
                .sim-verify-note {
                    font-size: 13px;
                    color: #333;
                    margin-top: 20px;
                }
                .sim-verify-actions {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 40px;
                }
                .sim-back-border-btn {
                    padding: 10px 30px;
                    border: 1px solid #1b3281;
                    border-radius: 4px;
                    background: #fff;
                    color: #1b3281;
                    font-weight: 600;
                    cursor: pointer;
                }
                .sim-confirm-btn {
                    padding: 10px 40px;
                    background: #2b3a67;
                    color: #fff;
                    border: none;
                    border-radius: 4px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .sim-confirm-btn:hover {
                    background: #1b213a;
                }
            `}</style>
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
