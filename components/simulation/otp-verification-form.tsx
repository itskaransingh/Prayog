"use client";

import { useState, useRef, useEffect } from "react";
import { useRegistration } from "@/lib/simulation/registration-context";

interface OTPVerificationFormProps {
    onContinue: () => void;
    onBack: () => void;
}

const VALID_OTP = "123456";
const OTP_EXPIRY_SECONDS = 892; // 14m:52s
const RESEND_COOLDOWN_SECONDS = 2; // 00m:02s

export function OTPVerificationForm({ onContinue, onBack }: OTPVerificationFormProps) {
    const { data } = useRegistration();
    const { personalDetails, contactDetails, pan } = data;

    const [mobileOtp, setMobileOtp] = useState(["", "", "", "", "", ""]);
    const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);

    const [error, setError] = useState("");
    const [otpExpiryTimer, setOtpExpiryTimer] = useState(OTP_EXPIRY_SECONDS);
    const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN_SECONDS);
    const [attemptsRemaining, setAttemptsRemaining] = useState(3);

    const mobileRefs = useRef<(HTMLInputElement | null)[]>([]);
    const emailRefs = useRef<(HTMLInputElement | null)[]>([]);

    // OTP Expiry Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (otpExpiryTimer > 0) {
            interval = setInterval(() => setOtpExpiryTimer((t) => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [otpExpiryTimer]);

    // Resend Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendTimer > 0) {
            interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const maskMobileNumber = (mobile: string): string => {
        return "+91xxxx" + mobile.slice(-4);
    };

    const maskEmail = (email: string): string => {
        const [localPart, domain] = email.split("@");
        return "xxxxxxx@" + domain;
    };

    const formatTimer = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}m:${secs.toString().padStart(2, "0")}s`;
    };

    const handleOtpChange = (
        index: number,
        value: string,
        isEmail: boolean
    ) => {
        const sanitized = value.replace(/\D/g, "").slice(0, 1);
        const otpArray = isEmail ? [...emailOtp] : [...mobileOtp];
        otpArray[index] = sanitized;

        if (isEmail) {
            setEmailOtp(otpArray);
        } else {
            setMobileOtp(otpArray);
        }

        // Auto-focus next input if digit entered
        if (sanitized) {
            const refs = isEmail ? emailRefs.current : mobileRefs.current;
            if (index < 5) {
                // move within same OTP group
                refs[index + 1]?.focus();
            } else if (!isEmail) {
                // finished mobile OTP, move to first email box
                emailRefs.current[0]?.focus();
            }
        }
    };

    const handleOtpKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>,
        isEmail: boolean
    ) => {
        const refs = isEmail ? emailRefs.current : mobileRefs.current;

        // Backspace: move to previous input
        if (e.key === "Backspace") {
            const otpArray = isEmail ? [...emailOtp] : [...mobileOtp];
            otpArray[index] = "";
            if (isEmail) {
                setEmailOtp(otpArray);
            } else {
                setMobileOtp(otpArray);
            }
            if (index > 0) {
                refs[index - 1]?.focus();
            } else if (isEmail) {
                // if on first email digit and backspace, go to last mobile digit
                mobileRefs.current[5]?.focus();
            }
        }

        // Arrow keys for navigation
        if (e.key === "ArrowLeft" && index > 0) {
            refs[index - 1]?.focus();
        }
        if (e.key === "ArrowRight" && index < 5) {
            refs[index + 1]?.focus();
        }
    };

    const handleVerify = () => {
        const mobileOtpString = mobileOtp.join("");
        const emailOtpString = emailOtp.join("");

        if (mobileOtpString.length !== 6 || emailOtpString.length !== 6) {
            setError("Please enter all 6 digits for both Mobile and Email OTP");
            return;
        }

        if (mobileOtpString === VALID_OTP && emailOtpString === VALID_OTP) {
            onContinue();
        } else {
            setError("Invalid OTP. Hint: Use 123456 for both.");
        }
    };

    return (
        <div className="sim-form-card sim-form-card-full">
            <div className="sim-form-left">
                <h2 className="sim-form-title">Enter OTP</h2>

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
                            Mobile OTP <span>(Sent to {maskMobileNumber(contactDetails.mobile)})</span>
                        </label>
                        <div className="sim-otp-boxes">
                            {mobileOtp.map((digit, index) => (
                                <input
                                    key={`mobile-otp-${index}`}
                                    ref={(el) => {
                                        mobileRefs.current[index] = el;
                                    }}
                                    type="password"
                                    className="sim-otp-box"
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value, false)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e, false)}
                                    maxLength={1}
                                    inputMode="numeric"
                                    aria-label={`Mobile OTP digit ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Email OTP */}
                    <div className="sim-otp-section">
                        <label className="sim-otp-label">
                            Email OTP <span>(Sent to {maskEmail(contactDetails.email)})</span>
                        </label>
                        <div className="sim-otp-boxes">
                            {emailOtp.map((digit, index) => (
                                <input
                                    key={`email-otp-${index}`}
                                    ref={(el) => {
                                        emailRefs.current[index] = el;
                                    }}
                                    type="password"
                                    className="sim-otp-box"
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value, true)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e, true)}
                                    maxLength={1}
                                    inputMode="numeric"
                                    aria-label={`Email OTP digit ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Status Section */}
                    <div className="sim-otp-status">
                        <div className="sim-status-row">
                            <span className="sim-status-label">Both OTP expires in</span>
                            <span className="sim-status-value">{formatTimer(otpExpiryTimer)}</span>
                        </div>
                        <div className="sim-status-row">
                            <span className="sim-status-label">Attempts remaining</span>
                            <span className="sim-status-value">{attemptsRemaining}</span>
                        </div>
                        <div className="sim-status-row">
                            <span className="sim-status-label">Resend OTP Available in</span>
                            <span className="sim-status-value">{formatTimer(resendTimer)}</span>
                        </div>
                        <div className="sim-status-note">
                            Note: You can go back and update your details if required.
                        </div>
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
                        className={`sim-continue-btn ${mobileOtp.every((d) => d !== "") && emailOtp.every((d) => d !== "") ? "enabled" : ""
                            }`}
                        disabled={!(mobileOtp.every((d) => d !== "") && emailOtp.every((d) => d !== ""))}
                        onClick={handleVerify}
                    >
                        Verify &rsaquo;
                    </button>
                </div>
            </div>
        </div>
    );
}
