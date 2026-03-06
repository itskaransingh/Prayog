"use client";

import { useState, useEffect } from "react";
import { PortalHeader } from "@/components/simulation/portal-header";
import { PortalFooter } from "@/components/simulation/portal-footer";
import { ProgressStepper } from "@/components/simulation/progress-stepper";
import { RegistrationForm } from "@/components/simulation/registration-form";
import { FillDetailsForm } from "@/components/simulation/fill-details-form";
import { OTPVerificationForm } from "@/components/simulation/otp-verification-form";
import { VerifyDetailsSection } from "@/components/simulation/verify-details-section";
import { PasswordCreationForm } from "@/components/simulation/password-creation-form";
import {
    RegistrationProvider,
    useRegistration,
} from "@/lib/simulation/registration-context";
import { EvaluationPopup } from "@/components/simulation/evaluation-results";

function StepContent({ onRegister }: { onRegister: () => void }) {
    const { currentStep, nextStep, prevStep, updateData } =
        useRegistration();
    const [otpVerified, setOtpVerified] = useState(false);

    switch (currentStep) {
        case 1:
            return (
                <RegistrationForm
                    onContinue={(stepData) => {
                        updateData({ registerAs: stepData.registerAs as "taxpayer" | "others", pan: stepData.pan });
                        nextStep();
                    }}
                    onBack={() => window.location.href = "/simulation/gateway"}
                />
            );
        case 2:
            return <FillDetailsForm onContinue={nextStep} onBack={prevStep} />;
        case 3:
            if (!otpVerified) {
                return (
                    <OTPVerificationForm
                        onContinue={() => setOtpVerified(true)}
                        onBack={prevStep}
                    />
                );
            }
            return (
                <VerifyDetailsSection
                    onContinue={nextStep}
                    onBack={() => setOtpVerified(false)}
                />
            );
        case 4:
            return <PasswordCreationForm onRegister={onRegister} onBack={prevStep} />;
        default:
            return null;
    }
}

const STEP_HEADINGS: Record<number, string> = {
    1: "Register and find all your tax data in a single secure platform!",
    2: "Fill in your personal, address, and contact details",
    3: "Verify the details you have entered",
    4: "Set up your password and secure your account",
};

export default function SimulationPage() {
    return (
        <RegistrationProvider>
            <SimulationContent />
        </RegistrationProvider>
    );
}

function SimulationContent() {
    const { data, transactionId, isCompleted, completeRegistration, evaluationResults } = useRegistration();
    const [showEvalPopup, setShowEvalPopup] = useState(false);

    // Auto-show evaluation popup after 1 second
    useEffect(() => {
        if (isCompleted && evaluationResults) {
            const timer = setTimeout(() => setShowEvalPopup(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [isCompleted, evaluationResults]);

    if (isCompleted) {
        // Mask helpers
        const maskedPan = data.pan.length >= 5
            ? data.pan.slice(0, 3) + '****' + data.pan.slice(-1)
            : data.pan;
        const maskedTxn = transactionId && transactionId.length > 6
            ? transactionId.slice(0, 3) + '*'.repeat(transactionId.length - 6) + transactionId.slice(-3)
            : transactionId;

        const maskedEmail = data.contactDetails.email
            ? data.contactDetails.email.replace(/(.{2}).+(@.+)/, '$1****$2').toUpperCase()
            : '';
        const maskedMobile = data.contactDetails.mobile
            ? '+91  ' + data.contactDetails.mobile.slice(0, 4) + '****' + data.contactDetails.mobile.slice(-2)
            : '';

        return (
            <>
                <PortalHeader />
                <main className="sim-success-page-body">
                    {/* Breadcrumb */}
                    <div className="sim-success-breadcrumb">
                        <a href="#">Home</a>
                        <span className="sep">&rsaquo;</span>
                        <span>Register</span>
                    </div>

                    {/* Top success card */}
                    <div className="sim-success-card">
                        <div className="sim-success-card-icon">
                            <div className="doc-illustration">📄</div>
                            <div className="check-circle">✓</div>
                        </div>
                        <div className="sim-success-card-body">
                            <h2>Registered successfully!</h2>
                            <p>Thank you for registering with e-Filing.</p>
                            <p>Your Transaction ID : <span className="txn-id">{maskedTxn}</span></p>
                        </div>
                    </div>

                    {/* User ID card */}
                    <div className="sim-userid-card">
                        <h3>
                            Your e-Filing portal User ID is <span className="user-id-value">{maskedPan}.</span>
                        </h3>
                        <p>
                            A confirmation E-mail is sent to <span className="contact-info">{maskedEmail}</span> and an SMS to <span className="contact-info">{maskedMobile}.</span>
                        </p>

                        <div className="info-note">
                            <div className="info-icon">i</div>
                            <span>
                                With this registration, you will get the access to limited features. Please login and update your profile to
                                get access to all the features provided by the department, like &quot;Add Bank Account&quot;, &quot;Link Aadhaar&quot;..
                                etc.
                            </span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <button
                            className="sim-proceed-btn"
                            onClick={() => window.location.href = '/'}
                        >
                            Proceed To Login
                        </button>
                        <button
                            className="sim-view-eval-btn"
                            onClick={() => setShowEvalPopup(true)}
                        >
                            📊 View Evaluation
                        </button>
                    </div>
                </main>
                <PortalFooter />

                {/* Evaluation popup */}
                <EvaluationPopup
                    open={showEvalPopup}
                    onClose={() => setShowEvalPopup(false)}
                />
            </>
        );
    }

    return (
        <>
            <PortalHeader />

            <main className="sim-page-body">
                {/* Breadcrumb */}
                <div className="sim-breadcrumb">
                    <a href="#">Home</a>
                    <span className="sim-breadcrumb-sep">&rsaquo;</span>
                    <span>Register</span>
                </div>

                {/* Dynamic Progress Stepper */}
                <ProgressStepper />

                {/* Dynamic Heading */}
                <StepHeading />

                <p className="sim-mandatory-note">
                    <span>*</span> Indicates mandatory fields
                </p>

                {/* Step-aware content */}
                <StepContent onRegister={completeRegistration} />
            </main>

            <PortalFooter />
        </>
    );
}

function StepHeading() {
    const { currentStep } = useRegistration();
    return (
        <h1 className="sim-page-heading">
            {STEP_HEADINGS[currentStep]}
        </h1>
    );
}
