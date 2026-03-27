"use client";

import { useState } from "react";
import { PortalFooter } from "@/components/simulation/income-tax/shared/portal-footer";
import { PortalHeader } from "@/components/simulation/income-tax/shared/portal-header";
import { ProgressStepper } from "@/components/simulation/income-tax/shared/progress-stepper";
import { EPANAadhaarForm } from "./epan-aadhaar-form";
import { EPANConfirmSubmit } from "./epan-confirm-submit";
import { EPANConsentOtp } from "./epan-consent-otp";
import { EPANValidateDetails } from "./epan-validate-details";
import { EPAN_STEPS, type EPANConfirmSummary, type EPANAadhaarDetails, type EPANOtpState } from "./types";

const DEMO_DETAILS: EPANAadhaarDetails = {
    aadhaarNumber: "**** **** 6611",
    name: "Avinash Ohja",
    dateOfBirth: "25/09/2000",
    gender: "Male",
    mobileNumber: "2347617171",
    email: "avinash12345@nergymail.com",
    address: "Ram Tirath Road, Batala, Gurdaspur, Punjab, 143505",
};

const DEMO_SUMMARY: EPANConfirmSummary = {
    acknowledgementNumber: "******",
};

export function EPANUiShowcase() {
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
    const [aadhaarNumber, setAadhaarNumber] = useState("999900006611");
    const [stepOneChecked, setStepOneChecked] = useState(true);
    const [otpConsentChecked, setOtpConsentChecked] = useState(true);
    const [detailsAccepted, setDetailsAccepted] = useState(false);
    const [showOtpPanel, setShowOtpPanel] = useState(false);
    const [showEmailOtp, setShowEmailOtp] = useState(true);
    const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
    const [emailOtpDigits, setEmailOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);

    const validationError =
        aadhaarNumber.length > 0 && aadhaarNumber.length < 12
            ? "Please enter the valid 12 digit Aadhaar number."
            : "";

    const otpState: EPANOtpState = {
        digits: otpDigits,
        maskedTarget: "+91 23******71 and primary email id avinash12345@nergymail.com",
        codeHint: "448488",
        timerText: "OTP expires in 14m:52s",
        attemptsText: "3 Attempts remaining",
        resendText: "Resend OTP (Available in 00m:02s)",
        canResend: false,
    };

    const emailOtpState: EPANOtpState = {
        digits: emailOtpDigits,
        codeHint: "384611",
        timerText: "OTP expires in 14m:52s",
        attemptsText: "3 Attempts remaining",
        resendText: "Resend OTP",
        canResend: true,
    };

    return (
        <>
            <PortalHeader />
            <main className="epan-page-body">
                <div className="epan-breadcrumb">
                    <a href="#">Home</a>
                    <span>›</span>
                    <span>e-PAN</span>
                </div>

                <ProgressStepper
                    steps={EPAN_STEPS}
                    currentStep={currentStep}
                    className="epan-stepper"
                    stepClassName="epan-step"
                    activeClassName="active"
                    completedClassName="completed"
                    rowClassName="epan-step-row"
                    numberClassName="epan-step-number"
                    labelClassName="epan-step-label"
                    connectorClassName="epan-step-connector"
                />

                <div className="epan-dev-toolbar">
                    <span>UI preview</span>
                    <div>
                        {[1, 2, 3, 4].map((step) => (
                            <button
                                key={step}
                                type="button"
                                className={`epan-preview-chip ${currentStep === step ? "active" : ""}`}
                                onClick={() => setCurrentStep(step as 1 | 2 | 3 | 4)}
                            >
                                Step {step}
                            </button>
                        ))}
                        {currentStep === 2 ? (
                            <button
                                type="button"
                                className={`epan-preview-chip ${showOtpPanel ? "active" : ""}`}
                                onClick={() => setShowOtpPanel((prev) => !prev)}
                            >
                                {showOtpPanel ? "OTP View" : "Consent View"}
                            </button>
                        ) : null}
                        {currentStep === 3 ? (
                            <button
                                type="button"
                                className={`epan-preview-chip ${showEmailOtp ? "active" : ""}`}
                                onClick={() => setShowEmailOtp((prev) => !prev)}
                            >
                                {showEmailOtp ? "Hide Email OTP" : "Show Email OTP"}
                            </button>
                        ) : null}
                    </div>
                </div>

                {currentStep === 1 ? (
                    <>
                        <div className="epan-heading-row">
                            <h1 className="epan-page-title">Get New e-PAN</h1>
                            <p className="epan-mandatory-note"><span>*</span> Indicates mandatory fields</p>
                        </div>
                        <EPANAadhaarForm
                            aadhaarNumber={aadhaarNumber}
                            checkboxChecked={stepOneChecked}
                            validationError={validationError}
                            onAadhaarChange={setAadhaarNumber}
                            onCheckboxChange={setStepOneChecked}
                            onCancel={() => undefined}
                            onContinue={() => setCurrentStep(2)}
                        />
                    </>
                ) : null}

                {currentStep === 2 ? (
                    <EPANConsentOtp
                        mode={showOtpPanel ? "otp" : "consent"}
                        consentAccepted={otpConsentChecked}
                        otpState={otpState}
                        onConsentChange={setOtpConsentChecked}
                        onOtpChange={setOtpDigits}
                        onCancel={() => setCurrentStep(1)}
                        onContinue={() => setCurrentStep(3)}
                    />
                ) : null}

                {currentStep === 3 ? (
                    <EPANValidateDetails
                        details={DEMO_DETAILS}
                        acceptanceChecked={detailsAccepted}
                        onAcceptanceChange={setDetailsAccepted}
                        onCancel={() => setCurrentStep(2)}
                        onContinue={() => setCurrentStep(4)}
                        emailOtpState={showEmailOtp ? emailOtpState : null}
                        onEmailOtpChange={setEmailOtpDigits}
                        onValidateEmail={() => setShowEmailOtp(true)}
                        onSubmitEmailOtp={() => undefined}
                    />
                ) : null}

                {currentStep === 4 ? (
                    <EPANConfirmSubmit
                        summary={DEMO_SUMMARY}
                        onLogin={() => undefined}
                        onViewEvaluation={() => undefined}
                    />
                ) : null}
            </main>
            <PortalFooter />
        </>
    );
}
