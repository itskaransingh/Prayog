"use client";

import { useState, useEffect, useCallback } from "react";
import { useRegistration } from "@/lib/simulation/registration-context";

interface OTPVerificationFormProps {
    onContinue: () => void;
    onBack: () => void;
}

const VALID_OTP = "123456";
const RESEND_COOLDOWN = 30;

export function OTPVerificationForm({ onContinue, onBack }: OTPVerificationFormProps) {
    const { data } = useRegistration();
    const { personalDetails, contactDetails, pan } = data;

    const [mobileOtp, setMobileOtp] = useState("");
    const [emailOtp, setEmailOtp] = useState("");

    const [mobileTimer, setMobileTimer] = useState(0);
    const [emailTimer, setEmailTimer] = useState(0);

    const [mobileOtpSent, setMobileOtpSent] = useState(false);
    const [emailOtpSent, setEmailOtpSent] = useState(false);

    const [error, setError] = useState("");

    // Timer logic
    useEffect(() => {
        let mInterval: NodeJS.Timeout;
        if (mobileTimer > 0) {
            mInterval = setInterval(() => setMobileTimer((t) => t - 1), 1000);
        }
        return () => clearInterval(mInterval);
    }, [mobileTimer]);

    useEffect(() => {
        let eInterval: NodeJS.Timeout;
        if (emailTimer > 0) {
            eInterval = setInterval(() => setEmailTimer((t) => t - 1), 1000);
        }
        return () => clearInterval(eInterval);
    }, [emailTimer]);

    const handleSendMobileOtp = () => {
        setMobileTimer(RESEND_COOLDOWN);
        setMobileOtpSent(true);
        setError("");
    };

    const handleSendEmailOtp = () => {
        setEmailTimer(RESEND_COOLDOWN);
        setEmailOtpSent(true);
        setError("");
    };

    const handleVerify = () => {
        if (!mobileOtpSent || !emailOtpSent) {
            setError("Please send and enter both OTPs");
            return;
        }
        if (mobileOtp === VALID_OTP && emailOtp === VALID_OTP) {
            onContinue();
        } else {
            setError("Invalid OTP. Hint: Use 123456 for both.");
        }
    };

    return (
        <div className="sim-form-card sim-form-card-full">
            <div className="sim-form-left">
                <h2 className="sim-form-title">Verify Your Details</h2>

                {/* Summary Section */}
                <div className="sim-verify-summary">
                    <div className="sim-summary-grid">
                        <div className="sim-summary-item">
                            <span className="sim-summary-label">PAN</span>
                            <span className="sim-summary-value">{pan}</span>
                        </div>
                        <div className="sim-summary-item">
                            <span className="sim-summary-label">Name</span>
                            <span className="sim-summary-value">
                                {personalDetails.firstName} {personalDetails.lastName}
                            </span>
                        </div>
                        <div className="sim-summary-item">
                            <span className="sim-summary-label">Mobile</span>
                            <span className="sim-summary-value">{contactDetails.mobile}</span>
                        </div>
                        <div className="sim-summary-item">
                            <span className="sim-summary-label">Email</span>
                            <span className="sim-summary-value">{contactDetails.email}</span>
                        </div>
                    </div>
                </div>

                <p style={{ fontSize: 13, color: "#666", marginBottom: 32 }}>
                    OTP has been successfully sent to your mobile number and email ID.
                    <span style={{ color: "#1b3281", fontWeight: 600, marginLeft: 4 }}>
                        Hint: Enter 123456
                    </span>
                </p>

                <div className="sim-otp-container">
                    {/* Mobile OTP */}
                    <div className="sim-otp-section">
                        <label className="sim-otp-label">
                            Mobile OTP <span>(Sent to {contactDetails.mobile})</span>
                        </label>
                        <div className="sim-otp-input-row">
                            <input
                                type="text"
                                className="sim-input sim-otp-input"
                                value={mobileOtp}
                                onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                maxLength={6}
                                placeholder="------"
                            />
                            <button
                                type="button"
                                className="sim-validate-btn"
                                onClick={handleSendMobileOtp}
                                disabled={mobileTimer > 0}
                            >
                                {mobileOtpSent ? "Resend OTP" : "Send OTP"}
                            </button>
                        </div>
                        {mobileTimer > 0 && (
                            <span className="sim-resend-timer">Resend OTP in {mobileTimer}s</span>
                        )}
                    </div>

                    {/* Email OTP */}
                    <div className="sim-otp-section">
                        <label className="sim-otp-label">
                            Email OTP <span>(Sent to {contactDetails.email})</span>
                        </label>
                        <div className="sim-otp-input-row">
                            <input
                                type="text"
                                className="sim-input sim-otp-input"
                                value={emailOtp}
                                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                maxLength={6}
                                placeholder="------"
                            />
                            <button
                                type="button"
                                className="sim-validate-btn"
                                onClick={handleSendEmailOtp}
                                disabled={emailTimer > 0}
                            >
                                {emailOtpSent ? "Resend OTP" : "Send OTP"}
                            </button>
                        </div>
                        {emailTimer > 0 && (
                            <span className="sim-resend-timer">Resend OTP in {emailTimer}s</span>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="sim-error-msg" style={{ marginTop: 24 }}>
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
                        className={`sim-continue-btn ${(mobileOtpSent && emailOtpSent && mobileOtp.length === 6 && emailOtp.length === 6) ? "enabled" : ""}`}
                        disabled={!(mobileOtpSent && emailOtpSent && mobileOtp.length === 6 && emailOtp.length === 6)}
                        onClick={handleVerify}
                    >
                        Verify &rsaquo;
                    </button>
                </div>
            </div>
        </div>
    );
}
