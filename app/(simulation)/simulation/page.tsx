"use client";

import { useState } from "react";
import { PortalHeader } from "@/components/simulation/portal-header";
import { PortalFooter } from "@/components/simulation/portal-footer";
import { ProgressStepper } from "@/components/simulation/progress-stepper";
import { RegistrationForm } from "@/components/simulation/registration-form";
import { FillDetailsForm } from "@/components/simulation/fill-details-form";
import { OTPVerificationForm } from "@/components/simulation/otp-verification-form";
import { PasswordCreationForm } from "@/components/simulation/password-creation-form";
import {
    RegistrationProvider,
    useRegistration,
} from "@/lib/simulation/registration-context";
import { EvaluationResults } from "@/components/simulation/evaluation-results";

function StepContent({ onRegister }: { onRegister: () => void }) {
    const { currentStep, nextStep, prevStep, updateData } =
        useRegistration();

    switch (currentStep) {
        case 1:
            return (
                <RegistrationForm
                    onContinue={(stepData) => {
                        updateData({ registerAs: stepData.registerAs as "taxpayer" | "others", pan: stepData.pan });
                        nextStep();
                    }}
                />
            );
        case 2:
            return <FillDetailsForm onContinue={nextStep} onBack={prevStep} />;
        case 3:
            return <OTPVerificationForm onContinue={nextStep} onBack={prevStep} />;
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
    const { isCompleted, completeRegistration, evaluationResults } = useRegistration();

    if (isCompleted) {
        return (
            <>
                <PortalHeader />
                <main className="sim-page-body">
                    <div className="sim-form-card sim-form-card-full" style={{ display: 'block' }}>
                        <div className="sim-success-view">
                            <div className="sim-success-icon">✓</div>
                            <h1 className="sim-success-title">Congratulations!</h1>
                            <p className="sim-success-subtitle">
                                You have successfully registered on the e-Filing portal.
                                Below is your evaluation report based on the case study data.
                            </p>

                            <EvaluationResults />

                            <div style={{ width: "300px", marginTop: "40px" }}>
                                <button
                                    className="sim-continue-btn enabled"
                                    onClick={() => window.location.href = "/"}
                                >
                                    Return to Course
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
                <PortalFooter />
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
