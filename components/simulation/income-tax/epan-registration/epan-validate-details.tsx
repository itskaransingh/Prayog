"use client";

import { useState } from "react";
import { EPANOtpInput } from "./epan-otp-input";
import type { EPANAadhaarDetails, EPANOtpState } from "./types";

interface EPANValidateDetailsProps {
    details: EPANAadhaarDetails;
    acceptanceChecked: boolean;
    emailValidated: boolean;
    onAcceptanceChange: (checked: boolean) => void;
    onContinue: () => void;
    onCancel: () => void;
    emailOtpState?: EPANOtpState | null;
    onEmailOtpChange?: (digits: string[]) => void;
    onValidateEmail?: () => void;
    onSubmitEmailOtp?: () => void;
}

export function EPANValidateDetails({
    details,
    acceptanceChecked,
    emailValidated,
    onAcceptanceChange,
    onContinue,
    onCancel,
    emailOtpState,
    onEmailOtpChange,
    onValidateEmail,
    onSubmitEmailOtp,
}: EPANValidateDetailsProps) {
    const [isEmailOtpOpen, setIsEmailOtpOpen] = useState(false);
    const [isEmailOtpVisible, setIsEmailOtpVisible] = useState(false);

    const isOtpComplete = emailOtpState?.digits.every((digit) => digit !== "") ?? false;
    const canContinue = acceptanceChecked && emailValidated;

    const handleValidateEmail = () => {
        setIsEmailOtpOpen(true);
        onValidateEmail?.();
    };

    const handleCancelEmailOtp = () => {
        setIsEmailOtpOpen(false);
        onEmailOtpChange?.(["", "", "", "", "", ""]);
    };

    const handleSubmitEmailOtp = () => {
        if (!isOtpComplete) return;
        onSubmitEmailOtp?.();
        setIsEmailOtpOpen(false);
    };

    return (
        <div className="epan-step-shell">
            <h1 className="epan-page-title">Your personal data based on Aadhaar e-KYC</h1>

            <div className="epan-details-card">
                <div className="epan-details-head">
                    <span>Fields</span>
                    <span>Details</span>
                </div>

                <div className="epan-details-row">
                    <span>Photo</span>
                    <div className="epan-avatar-cell">
                        <div className="epan-avatar" aria-label={details.photoAlt ?? "Applicant avatar"}>
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                <circle cx="32" cy="22" r="13" fill="#d9d9d9" stroke="#2f2f2f" strokeWidth="4" />
                                <path d="M16 51c0-8.837 7.163-16 16-16s16 7.163 16 16" fill="#d9d9d9" stroke="#2f2f2f" strokeWidth="4" />
                            </svg>
                        </div>
                    </div>
                </div>

                <DetailRow label="Aadhaar Number" value={details.aadhaarNumber} />
                <DetailRow label="Name" value={details.name} />
                <DetailRow label="Date of Birth" value={details.dateOfBirth} />
                <DetailRow label="Gender" value={details.gender} />
                <DetailRow label="Mobile Number" value={details.mobileNumber} />

                <div className={`epan-details-row ${isEmailOtpOpen ? "epan-details-row-expanded" : ""}`}>
                    <span>Email id</span>
                    <div className="epan-email-cell">
                        <div className="epan-email-inline">
                            <span>{details.email}</span>
                            {emailValidated ? (
                                <span className="epan-email-validated">
                                    <span className="epan-email-validated-icon" aria-hidden="true">
                                        ✓
                                    </span>
                                    Validated
                                </span>
                            ) : onValidateEmail ? (
                                <button type="button" className="epan-link-button" onClick={handleValidateEmail}>
                                    Validate email
                                </button>
                            ) : null}
                        </div>

                        {isEmailOtpOpen && emailOtpState && onEmailOtpChange ? (
                            <div className="epan-inline-otp-panel">
                                <p className="epan-inline-otp-label">
                                    Enter the OTP<span className="epan-required">*</span>
                                    {emailOtpState.codeHint ? <strong>[{emailOtpState.codeHint}]</strong> : null}
                                </p>
                                <div className="epan-inline-otp-entry">
                                    <EPANOtpInput value={emailOtpState.digits} onChange={onEmailOtpChange} isMasked={!isEmailOtpVisible} />
                                    <button
                                        type="button"
                                        className="epan-otp-visibility"
                                        aria-label={isEmailOtpVisible ? "Hide OTP" : "Show OTP"}
                                        onClick={() => setIsEmailOtpVisible(!isEmailOtpVisible)}
                                    >
                                        {isEmailOtpVisible ? (
                                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        ) : (
                                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.92-2.17 2.36-4.05 4.18-5.44" />
                                                <path d="M10.59 10.58A2 2 0 1 0 13.41 13.4" />
                                                <path d="M1 1l22 22" />
                                                <path d="M9.88 5.09A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a11.64 11.64 0 0 1-4.24 5.08" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <div className="epan-otp-meta">
                                    <span>{emailOtpState.timerText ?? "OTP expires in 14m:52s"}</span>
                                    <span>{emailOtpState.attemptsText ?? "3 Attempts remaining"}</span>
                                </div>
                                <button type="button" className="epan-resend-link is-enabled">
                                    {emailOtpState.resendText ?? "Resend OTP"}
                                </button>
                                <div className="epan-inline-otp-actions epan-inline-otp-actions-end">
                                    <button type="button" className="epan-btn epan-btn-secondary epan-btn-small" onClick={handleCancelEmailOtp}>
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="epan-btn epan-btn-primary epan-btn-small"
                                        disabled={!isOtpComplete}
                                        onClick={handleSubmitEmailOtp}
                                    >
                                        Submit
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                <DetailRow label="Address" value={details.address} />
            </div>

            <label className="epan-checkbox-row epan-checkbox-row-top">
                <input
                    type="checkbox"
                    checked={acceptanceChecked}
                    onChange={(event) => onAcceptanceChange(event.target.checked)}
                />
                <span>I accept that <span className="epan-required">*</span></span>
            </label>

            <ol className="epan-declaration-list">
                <li>The above details are correct and I hereby certify that I do not have any PAN allotted to me.</li>
                <li>In case I am found to be in possession of more than one PAN then I shall be liable for penalty of Rs. 10,000/- under section 272B(1).</li>
                <li>I agree that Permanent Account Number may be allotted based on Aadhaar as per with Rule 114 (1B) of Income-Tax Rules 1962.</li>
            </ol>

            <div className="epan-actions">
                <button type="button" className="epan-btn epan-btn-secondary" onClick={onCancel}>
                    Cancel
                </button>
                <button
                    type="button"
                    className="epan-btn epan-btn-primary"
                    disabled={!canContinue}
                    onClick={onContinue}
                >
                    Continue <span aria-hidden="true">›</span>
                </button>
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="epan-details-row">
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}
