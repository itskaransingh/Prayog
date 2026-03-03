"use client";

import { useState, useMemo } from "react";
import { useRegistration } from "@/lib/simulation/registration-context";

interface PasswordCreationFormProps {
    onRegister: () => void;
    onBack: () => void;
}

export function PasswordCreationForm({ onRegister, onBack }: PasswordCreationFormProps) {
    const { data } = useRegistration();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");

    const rules = useMemo(() => {
        return [
            { id: "length", label: "8-14 characters", met: password.length >= 8 && password.length <= 14 },
            { id: "upper", label: "At least one uppercase", met: /[A-Z]/.test(password) },
            { id: "lower", label: "At least one lowercase", met: /[a-z]/.test(password) },
            { id: "digit", label: "At least one digit", met: /\d/.test(password) },
            { id: "special", label: "At least one special character (@#$%)", met: /[@#$%^&*!]/.test(password) },
            { id: "pan", label: "Should not contain PAN", met: password.length > 0 && !password.toUpperCase().includes(data.pan.toUpperCase()) },
        ];
    }, [password, data.pan]);

    const strength = useMemo(() => {
        if (!password) return 0;
        const metCount = rules.filter(r => r.met).length;
        if (metCount <= 2) return 1;
        if (metCount <= 4) return 2;
        if (metCount === 5) return 3;
        return 4;
    }, [rules, password]);

    const strengthLabel = ["", "Weak", "Medium", "Good", "Strong"][strength];

    const canSubmit = rules.every(r => r.met) && password === confirmPassword && password.length > 0;

    const handleRegister = () => {
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        onRegister();
    };

    return (
        <div className="sim-form-card sim-form-card-full">
            <div className="sim-form-left">
                <h2 className="sim-form-title">Secure Your Account</h2>

                <div className="sim-form-row" style={{ marginBottom: 24 }}>
                    <label className="sim-field-label">Set Password <span className="required">*</span></label>
                    <div className="sim-password-field">
                        <input
                            type={showPassword ? "text" : "password"}
                            className="sim-input sim-input-full"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                        />
                        <button
                            type="button"
                            className="sim-password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? "HIDE" : "SHOW"}
                        </button>
                    </div>

                    {/* Strength Meter */}
                    <div className="sim-strength-container">
                        <div className={`sim-strength-meter strength-${strength}`}>
                            <div className="sim-strength-segment seg-1"></div>
                            <div className="sim-strength-segment seg-2"></div>
                            <div className="sim-strength-segment seg-3"></div>
                            <div className="sim-strength-segment seg-4"></div>
                        </div>
                        {password && (
                            <div className="sim-strength-label" style={{
                                color: strength === 1 ? "#e53e3e" : strength === 2 ? "#dd6b20" : strength === 3 ? "#d69e2e" : "#38a169"
                            }}>
                                {strengthLabel}
                            </div>
                        )}
                    </div>

                    {/* Rules Checklist */}
                    <div className="sim-password-checklist">
                        {rules.map(rule => (
                            <div key={rule.id} className={`sim-rule-item ${rule.met ? "met" : ""}`}>
                                <div className="sim-rule-icon"></div>
                                {rule.label}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="sim-form-row" style={{ marginBottom: 32 }}>
                    <label className="sim-field-label">Confirm Password <span className="required">*</span></label>
                    <div className="sim-password-field">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            className="sim-input sim-input-full"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                        />
                        <button
                            type="button"
                            className="sim-password-toggle"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? "HIDE" : "SHOW"}
                        </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                        <div className="sim-error-msg" style={{ marginTop: 12, marginBottom: 0 }}>
                            <span className="error-text">Passwords do not match</span>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="sim-error-msg" style={{ marginBottom: 24 }}>
                        <span className="error-label">Error : </span>
                        <span className="error-text">{error}</span>
                    </div>
                )}

                <div className="sim-actions sim-actions-row">
                    <button type="button" className="sim-back-btn" onClick={onBack}>
                        &lsaquo; Back
                    </button>
                    <button
                        type="button"
                        className={`sim-continue-btn ${canSubmit ? "enabled" : ""}`}
                        disabled={!canSubmit}
                        onClick={handleRegister}
                    >
                        Register &rsaquo;
                    </button>
                </div>
            </div>
        </div>
    );
}
