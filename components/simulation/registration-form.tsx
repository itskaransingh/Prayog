"use client";

import { useState, useCallback } from "react";
import { useRegistration } from "@/lib/simulation/registration-context";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

interface RegistrationFormProps {
    onContinue?: (data: { registerAs: string; pan: string }) => void;
    onBack?: () => void;
    onCancel?: () => void;
}

export function RegistrationForm({ onContinue, onBack, onCancel }: RegistrationFormProps) {
    const { data, updateData } = useRegistration();
    const [registerAs, setRegisterAs] = useState<"taxpayer" | "others">(data.registerAs);
    const [pan, setPan] = useState(data.pan);
    const [panError, setPanError] = useState("");
    const [panValidated, setPanValidated] = useState(data.pan.length === 10 && PAN_REGEX.test(data.pan));
    const [individualConfirm, setIndividualConfirm] = useState<"" | "yes" | "no">(data.individualConfirmation ?? "");

    const handlePanChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
        setPan(value);
        setPanError("");
        setPanValidated(false);
        setIndividualConfirm("");
    }, []);

    const handleValidate = useCallback(() => {
        if (!pan.trim()) {
            setPanError("PAN is required");
            setPanValidated(false);
            return;
        }
        if (!PAN_REGEX.test(pan)) {
            setPanError("Enter valid PAN number");
            setPanValidated(false);
            return;
        }
        setPanError("");
        setPanValidated(true);
    }, [pan]);

    const handleContinue = useCallback(() => {
        if (panValidated && individualConfirm === "yes" && onContinue) {
            updateData({
                registerAs,
                pan,
                individualConfirmation: individualConfirm,
            });
            onContinue({ registerAs, pan });
        }
    }, [panValidated, individualConfirm, registerAs, pan, onContinue, updateData]);

    return (
        <div className="sim-form-card">
            {/* Left: Form */}
            <div className="sim-form-left">
                <h2 className="sim-form-title">Let&apos;s get started</h2>

                {/* Register As toggle */}
                <label className="sim-field-label">Register as</label>
                <div className="sim-toggle-group">
                    <button
                        type="button"
                        className={`sim-toggle-btn ${registerAs === "taxpayer" ? "active" : ""}`}
                        onClick={() => setRegisterAs("taxpayer")}
                    >
                        Taxpayer
                    </button>
                    <button
                        type="button"
                        className={`sim-toggle-btn ${registerAs === "others" ? "active" : ""}`}
                        onClick={() => setRegisterAs("others")}
                    >
                        Others
                    </button>
                </div>

                {/* PAN field */}
                <label className="sim-field-label">
                    PAN <span className="required">*</span>
                </label>
                <div className="sim-input-row">
                    <input
                        type="text"
                        id="pan-input"
                        className={`sim-input ${panError ? "error" : ""}`}
                        value={pan}
                        onChange={handlePanChange}
                        placeholder=""
                        maxLength={10}
                        autoComplete="off"
                    />
                    <button
                        type="button"
                        className="sim-validate-btn"
                        onClick={handleValidate}
                    >
                        Validate
                    </button>
                </div>

                {/* Error message */}
                {panError && (
                    <div className="sim-error-msg">
                        <span className="error-label">Error : </span>
                        <span className="error-text">{panError}</span>
                    </div>
                )}

                {/* Success message */}
                {panValidated && !panError && (
                    <div className="sim-success-msg">
                        Success: PAN validated successfully.
                    </div>
                )}

                {/* Individual taxpayer confirmation */}
                {panValidated && !panError && (
                    <div style={{ marginBottom: 16 }}>
                        <label className="sim-field-label">
                            Please confirm if you want to register as{" "}
                            <span style={{ fontWeight: 600 }}>&quot;Individual taxpayer&quot;</span>
                        </label>
                        <div className="sim-radio-group">
                            <label className="sim-radio-label">
                                <input
                                    type="radio"
                                    className="sim-radio"
                                    name="individual-taxpayer"
                                    value="yes"
                                    checked={individualConfirm === "yes"}
                                    onChange={() => setIndividualConfirm("yes")}
                                />
                                Yes
                            </label>
                            <label className="sim-radio-label">
                                <input
                                    type="radio"
                                    className="sim-radio"
                                    name="individual-taxpayer"
                                    value="no"
                                    checked={individualConfirm === "no"}
                                    onChange={() => setIndividualConfirm("no")}
                                />
                                No
                            </label>
                        </div>
                        {individualConfirm === "yes" && (
                            <p style={{ fontSize: 12, color: "#374151", marginTop: 8 }}>
                                <span style={{ fontWeight: 600 }}>Note:</span> Please ensure your Status is correct as
                                details in subsequent screens will be based on your Status.
                            </p>
                        )}
                        {individualConfirm === "no" && (
                            <p style={{ fontSize: 12, color: "#374151", marginTop: 8 }}>
                                <span style={{ fontWeight: 600 }}>Note:</span> Please update your PAN or apply for a new PAN.
                            </p>
                        )}
                    </div>
                )}

                {/* Action buttons */}
                <div className="sim-actions">
                    <button
                        type="button"
                        className="sim-back-btn"
                        onClick={onBack}
                    >
                        &lsaquo; Back
                    </button>
                    <button
                        type="button"
                        className={`sim-continue-btn ${panValidated && individualConfirm === "yes" ? "enabled" : ""}`}
                        disabled={!panValidated || individualConfirm !== "yes"}
                        onClick={handleContinue}
                    >
                        Continue &rsaquo;
                    </button>
                    <button
                        type="button"
                        className="sim-cancel-btn"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                </div>
            </div>

            {/* Right: Info Panel */}
            <div className="sim-form-right">
                <div className="sim-form-right-icon">
                    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* User icon */}
                        <circle cx="32" cy="22" r="10" stroke="#bcc8e8" strokeWidth="2.5" fill="none" />
                        <path d="M12 54c0-11.046 8.954-20 20-20s20 8.954 20 20" stroke="#bcc8e8" strokeWidth="2.5" fill="none" />
                        {/* Document with rupee */}
                        <rect x="36" y="30" width="20" height="26" rx="2" stroke="#bcc8e8" strokeWidth="2" fill="#3d4f8f" />
                        <line x1="40" y1="38" x2="52" y2="38" stroke="#bcc8e8" strokeWidth="1.5" />
                        <line x1="40" y1="43" x2="52" y2="43" stroke="#bcc8e8" strokeWidth="1.5" />
                        <line x1="40" y1="48" x2="48" y2="48" stroke="#bcc8e8" strokeWidth="1.5" />
                        <text x="50" y="52" fontSize="10" fill="#90caf9" fontWeight="700">₹</text>
                    </svg>
                </div>

                <div className="sim-form-right-text">
                    Individuals / Hindu Undivided Family / Company / Trust / Local Authority
                    / Artificial Juridical Person / Firm / Limited Liability Partnership
                    / Association Of Persons / Political Party / Government / Body Of Individuals
                </div>
            </div>
        </div>
    );
}
