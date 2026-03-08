"use client";

import { useState, useMemo } from "react";
import { useRegistration } from "@/lib/simulation/registration-context";

interface PasswordCreationFormProps {
    onRegister: () => void;
    onBack: () => void;
}

export function PasswordCreationForm({ onRegister, onBack }: PasswordCreationFormProps) {
    const { data, updateData } = useRegistration();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");

    const rules = useMemo(() => {
        return [
            { id: "length", label: "Use 8 to 14 characters", met: password.length >= 8 && password.length <= 14 },
            { id: "cases", label: "Use uppercase and lowercase letters (e.g. Aa)", met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
            { id: "digit", label: "Use a number (e.g. 123)", met: /\d/.test(password) },
            { id: "special", label: "Use a special character (e.g. @#%*)", met: /[@#$%^&*!]/.test(password) },
        ];
    }, [password]);

    const strength = useMemo(() => {
        if (!password) return 0;
        const metCount = rules.filter(r => r.met).length;
        if (metCount <= 2) return 1;
        if (metCount <= 4) return 2;
        if (metCount === 5) return 3;
        return 4;
    }, [rules, password]);

    const strengthLabel = ["", "Weak", "Medium", "Good", "Strong"][strength];
    const strengthClass = strength === 1 ? "weak" : strength === 2 ? "medium" : strength >= 3 ? "strong" : "";

    const canSubmit = rules.every(r => r.met) && password === confirmPassword && password.length > 0 && (data.personalizedMessage || "").length > 0;

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
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (error) setError("");
                            }}
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

                    {/* Strength Banner */}
                    {password && (
                        <div className={`sim-password-strength-banner ${strengthClass}`}>
                            Password Strength: <strong>{strengthLabel}</strong>
                        </div>
                    )}

                    {/* Rules Checklist */}
                    {password.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                            <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>Password must fulfill following criteria:</p>
                            <div className="sim-password-checklist-simple">
                                {rules.map(rule => (
                                    <div key={rule.id} className={`sim-rule-item-simple ${rule.met ? "met" : "unmet"}`}>
                                        <span className="sim-rule-status-icon">
                                            {rule.met ? "✔" : "✖"}
                                        </span>
                                        {rule.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="sim-form-row" style={{ marginBottom: 20 }}>
                    <label className="sim-field-label">Confirm Password <span className="required">*</span></label>
                    <div className="sim-password-field">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            className="sim-input sim-input-full"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (error) setError("");
                            }}
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

                {/* Personalized Message Field */}
                <div className="sim-form-row" style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <label className="sim-field-label" style={{ margin: 0 }}>Set your Personalized message <span className="required">*</span></label>
                    </div>
                    <div className="sim-personalized-message-wrapper" style={{ position: 'relative' }}>
                        <textarea
                            className="sim-input sim-input-full"
                            style={{ height: 80, resize: 'none', paddingRight: 40 }}
                            value={data.personalizedMessage || ""}
                            maxLength={25}
                            onChange={(e) => updateData({ personalizedMessage: e.target.value })}
                            placeholder="Enter personalized message"
                        />
                        <div style={{ position: 'absolute', right: 10, top: 10, color: '#1b3281' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 11, color: '#666', marginTop: 4 }}>
                        Remaining characters: {25 - (data.personalizedMessage || "").length}
                    </div>

                    {(data.personalizedMessage || "").length > 0 && (
                        <div style={{ marginTop: 12 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: '#444', marginBottom: 8 }}>Personalized message criteria:</p>
                            <ul style={{ paddingLeft: 20, fontSize: 12, color: '#555', listStyleType: 'disc' }}>
                                <li style={{ marginBottom: 8 }}>
                                    Don't use your personally identifiable information like full name, Aadhaar number, bank account number, passport number and email address.
                                </li>
                                <li style={{ marginBottom: 8 }}>
                                    It should be something you can remember. Some examples:
                                    <ul style={{ paddingLeft: 20, marginTop: 8, listStyleType: 'circle' }}>
                                        <li style={{ marginBottom: 4 }}>I love my family</li>
                                        <li style={{ marginBottom: 4 }}>My pet name is Tommy</li>
                                        <li style={{ marginBottom: 4 }}>Banglore is my birth place.</li>
                                    </ul>
                                </li>
                            </ul>
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
                        &#8249; Back
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
