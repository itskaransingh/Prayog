"use client";

import { useState, useEffect, useRef } from "react";
import { PortalHeader } from "@/components/simulation/income-tax/shared/portal-header";
import { PortalFooter } from "@/components/simulation/income-tax/shared/portal-footer";
import { ProgressStepper } from "@/components/simulation/income-tax/shared/progress-stepper";
import { RegistrationForm } from "@/components/simulation/income-tax/itr-registration/registration-form";
import { FillDetailsForm } from "@/components/simulation/income-tax/itr-registration/fill-details-form";
import { OTPVerificationForm } from "@/components/simulation/income-tax/itr-registration/otp-verification-form";
import { VerifyDetailsSection } from "@/components/simulation/income-tax/itr-registration/verify-details-section";
import { PasswordCreationForm } from "@/components/simulation/income-tax/itr-registration/password-creation-form";
import { REGISTRATION_STEPS } from "@/lib/simulation/income-tax/itr-registration/constants";
import {
    RegistrationProvider,
    useRegistration,
} from "@/lib/simulation/income-tax/itr-registration/registration-context";
import { EvaluationPopup } from "@/components/simulation/income-tax/shared/evaluation-results";

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

import { createClient } from "@/lib/supabase/client";
import type { EvaluationMapping } from "@/lib/evaluation";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { buildAttemptAnswers, saveSimulationAttempt, type PersistableEvaluationMapping } from "@/lib/simulation/attempts";

const ITR_MAPPING_CACHE_PREFIX = "itr-simulation-mappings:";

function getCachedMappings(questionId: string): EvaluationMapping[] {
    if (typeof window === "undefined") {
        return [];
    }

    try {
        const raw = window.localStorage.getItem(`${ITR_MAPPING_CACHE_PREFIX}${questionId}`);
        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw) as EvaluationMapping[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export default function SimulationPage() {
    return (
        <Suspense fallback={<div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Loading Simulator...</div>}>
            <SimulationPageContent />
        </Suspense>
    );
}

function SimulationPageContent() {
    const searchParams = useSearchParams();
    const questionId = searchParams?.get('questionId') || '6771ce37-57d3-479f-a57c-d53affa3264a';

    return <SimulationPageQuestion key={questionId} questionId={questionId} />;
}

function SimulationPageQuestion({ questionId }: { questionId: string }) {
    const [mappings, setMappings] = useState<PersistableEvaluationMapping[]>(() => getCachedMappings(questionId) as PersistableEvaluationMapping[]);
    const [taskId, setTaskId] = useState<string | null>(null);

    useEffect(() => {
        async function loadMappings() {
            try {
                const supabase = createClient();
                
                // Get the task for this question
                const { data: tasks } = await supabase
                    .from("simulation_tasks")
                    .select("id")
                    .eq("question_id", questionId)
                    .limit(1);

                if (tasks && tasks.length > 0) {
                        const taskId = tasks[0].id;
                        setTaskId(taskId);

                        // 3. Get all steps and fields
                        const { data: steps } = await supabase
                            .from("simulation_steps")
                            .select("id")
                            .eq("task_id", taskId);

                        if (steps && steps.length > 0) {
                            const stepIds = steps.map(s => s.id);
                            const { data: fields } = await supabase
                                .from("simulation_fields")
                                .select("id, field_name, expected_value, field_label")
                                .in("step_id", stepIds);

                            if (fields) {
                                const newMappings: PersistableEvaluationMapping[] = fields.map(f => ({
                                    fieldId: f.id,
                                    fieldName: f.field_name,
                                    fieldPath: f.field_name,
                                    expectedValue: f.expected_value || "",
                                    label: f.field_label || f.field_name,
                                    weight: 1
                                }));
                                setMappings(newMappings);
                                try {
                                    window.localStorage.setItem(
                                        `${ITR_MAPPING_CACHE_PREFIX}${questionId}`,
                                        JSON.stringify(newMappings),
                                    );
                                } catch {
                                    // ignore storage errors
                                }
                            }
                        }
                    }
            } catch (err) {
                console.error("Failed to fetch simulation fields", err);
            }
        }
        loadMappings();
    }, [questionId]);

    return (
        <RegistrationProvider initialMappings={mappings}>
            <SimulationContent questionId={questionId} taskId={taskId} />
        </RegistrationProvider>
    );
}

function SimulationContent({ questionId, taskId }: { questionId: string; taskId: string | null }) {
    const { data, transactionId, isCompleted, completeRegistration, evaluationResults, evaluationMappings, startTime } = useRegistration();
    const [showEvalPopup, setShowEvalPopup] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const hasSavedAttemptRef = useRef(false);

    // Auto-show evaluation popup after 1 second
    useEffect(() => {
        if (isCompleted && evaluationResults) {
            const timer = setTimeout(() => setShowEvalPopup(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [isCompleted, evaluationResults]);

    useEffect(() => {
        async function persistAttempt() {
            if (!isCompleted || !evaluationResults || !startTime || hasSavedAttemptRef.current) {
                return;
            }

            hasSavedAttemptRef.current = true;
            setSaveError(null);

            try {
                await saveSimulationAttempt({
                    questionId,
                    taskId,
                    startTime,
                    endTime: startTime + evaluationResults.timeTakenSeconds * 1000,
                    answers: buildAttemptAnswers(data, evaluationMappings as PersistableEvaluationMapping[]),
                });
            } catch (error) {
                hasSavedAttemptRef.current = false;
                setSaveError(error instanceof Error ? error.message : "Failed to save attempt.");
            }
        }

        persistAttempt();
    }, [data, evaluationMappings, evaluationResults, isCompleted, questionId, startTime, taskId]);

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

                    {saveError && (
                        <div className="sim-userid-card" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#991b1b" }}>
                            <p>{saveError}</p>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <button
                            className="sim-proceed-btn"
                            onClick={() => window.location.href = '/simulation/gateway'}
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
                <ITRProgressStepper />

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

function ITRProgressStepper() {
    const { currentStep } = useRegistration();

    return (
        <ProgressStepper
            steps={REGISTRATION_STEPS}
            currentStep={currentStep}
        />
    );
}
