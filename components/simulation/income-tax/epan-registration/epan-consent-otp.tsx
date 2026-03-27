"use client";

import { useState } from "react";
import { EPANOtpInput } from "./epan-otp-input";
import type { EPANOtpState } from "./types";

interface EPANConsentOtpProps {
    mode: "consent" | "otp";
    consentAccepted: boolean;
    otpState: EPANOtpState;
    onConsentChange: (checked: boolean) => void;
    onOtpChange: (digits: string[]) => void;
    onContinue: () => void;
    onCancel: () => void;
    onResend?: () => void;
}

export function EPANConsentOtp({
    mode,
    consentAccepted,
    otpState,
    onConsentChange,
    onOtpChange,
    onContinue,
    onCancel,
    onResend,
}: EPANConsentOtpProps) {
    const [localConsent, setLocalConsent] = useState(consentAccepted);
    const [isOtpVisible, setIsOtpVisible] = useState(false);

    const isOtpComplete = otpState.digits.every((digit) => digit !== "");
    const canContinue = mode === "consent" ? localConsent : isOtpComplete;

    const handleContinue = () => {
        if (mode === "consent") {
            // Only update parent when continue is clicked
            onConsentChange(localConsent);
            onContinue();
        } else {
            onContinue();
        }
    };

    return (
        <div className="epan-step-shell">
            <h1 className="epan-page-title">OTP Validation</h1>
            <p className="epan-mandatory-note"><span>*</span> Indicates mandatory fields</p>

            <div className="epan-card">
                {mode === "consent" ? (
                    <>
                        <p className="epan-note epan-note-tight">
                            Request for generating OTP by SMS to your Aadhaar linked Mobile Number will be sent to UIDAI -
                            Please read the terms and provide consent.
                        </p>

                        <div className="epan-consent-box">
                            <h2>Consent Declaration for Generation of new PAN based on Aadhaar e-KYC details:</h2>
                            <ul className="epan-declaration-list-plain">
                                <li>
                                    1. I have understood the process of authentication described herein and hereby grant consent for
                                    use of my Aadhaar identity information (through Aadhaar based e-KYC authentication facility
                                    of UIDAI) for puropses of authentication of my identity in accordance with the provisions of the
                                    Aadhaar (Targeted Delivery of Financial and other Subsidies, Benefits and Services) Act, 2016
                                    and allied rules and regulations notified there under, and for purposes of verifying and
                                    validating my credentials as maintained by the Income Tax Department.
                                </li>
                                <li>
                                    2. I hereby grant consent to the Income Tax Department for recording, storing, using, updating,
                                    processing e-KYC data received through Aadhaar based eKYC authentication services of UIDAI,
                                    including my demographic information and photograph, for purpose of - (a) authenticating my
                                    identity on the e-filing portal www.incometaxindiaefiling.gov.in through measures including use
                                    of OneTime-Password/OTP, and/or (b) generating and allotting a PAN number and updating my
                                    information on the PAN database in accordance with my Aadhaar e-KYC data. I declare that my
                                    consent relating to e-KYC data above is voluntary and is my chosen alternative for submission
                                    of identity information.
                                </li>
                                <li>
                                    3. I have understood that I bear the sole responsibility for maintaining up-to-date information
                                    linked to my Aadhaar, PAN and any other related information provided to the Income Tax
                                    Department, and the Income Tax Department shall not be liable in any manner whatsoever for
                                    any actions taken, or lack thereof, due to my failure to update or correct any such information.
                                </li>
                                <li>
                                    4. I have understood that the Income Tax Department shall deploy reasonable security practices
                                    and safeguards to protect the security and confidentiality of data and information in
                                    possession or control of the Income Tax Department, and that such data and information will
                                    be stored for such time as may be prescribed by regulations issued by the UIDAI and other
                                    applicable law.
                                </li>
                                <li>
                                    5. I hereby Certify that I do not have any PAN allotted to me and in case I am found be in
                                    possession of more than one PAN then I shall be liable for penalty of Rs. 10,000/- under
                                    section 272B(1).
                                </li>
                            </ul>
                        </div>

                        <label className="epan-checkbox-row">
                            <input
                                type="checkbox"
                                checked={localConsent}
                                onChange={(event) => setLocalConsent(event.target.checked)}
                            />
                            <span>I have read the consent terms and agree to proceed further</span>
                        </label>
                    </>
                ) : (
                    <>
                        <h2 className="epan-card-title">Check your phone</h2>
                        <p className="epan-otp-helper">
                            We have sent a One Time Password (OTP) in a text message (SMS) to your Primary mobile number{" "}
                            <strong>{otpState.maskedTarget ?? "+91 23******71"}</strong>.
                        </p>
                        <p className="epan-otp-helper">
                            Enter the OTP<span className="epan-required">*</span>
                            {otpState.codeHint ? <strong>[{otpState.codeHint}]</strong> : null}
                        </p>

                        <div className="epan-otp-row">
                            <EPANOtpInput value={otpState.digits} onChange={onOtpChange} isMasked={!isOtpVisible} />
                            <button
                                type="button"
                                className="epan-otp-visibility"
                                aria-label={isOtpVisible ? "Hide OTP" : "Show OTP"}
                                onClick={() => setIsOtpVisible(!isOtpVisible)}
                            >
                                {isOtpVisible ? (
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
                            <span>{otpState.timerText ?? "OTP expires in 14m:52s"}</span>
                            <span>{otpState.attemptsText ?? "3 Attempts remaining"}</span>
                        </div>

                        <button
                            type="button"
                            className={`epan-resend-link ${otpState.canResend ? "is-enabled" : ""}`}
                            onClick={otpState.canResend ? onResend : undefined}
                        >
                            {otpState.resendText ?? "Resend OTP (Available in 00m:02s)"}
                        </button>

                        <label className="epan-checkbox-row epan-checkbox-row-spaced">
                            <input
                                type="checkbox"
                                checked={consentAccepted}
                                onChange={(event) => onConsentChange(event.target.checked)}
                            />
                            <span>
                                I agree to validate my Aadhaar details with UIDAI. After successful validation of OTP entered by you,
                                the request for e-KYC Aadhaar data will be fetched from UIDAI.
                            </span>
                        </label>
                    </>
                )}
            </div>

            <div className="epan-actions">
                <button type="button" className="epan-btn epan-btn-secondary" onClick={onCancel}>
                    Cancel
                </button>
                <button
                    type="button"
                    className="epan-btn epan-btn-primary"
                    disabled={!canContinue || (mode === "otp" && !consentAccepted)}
                    onClick={handleContinue}
                >
                    Continue <span aria-hidden="true">›</span>
                </button>
            </div>
        </div>
    );
}
