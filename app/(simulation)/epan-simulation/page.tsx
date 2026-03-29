"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { EPANProvider, useEPAN } from "@/lib/simulation/income-tax/epan-registration/epan-context";
import { EPAN_STEPS } from "@/lib/simulation/income-tax/epan-registration/constants";
import { PortalHeader } from "@/components/simulation/income-tax/shared/portal-header";
import { PortalFooter } from "@/components/simulation/income-tax/shared/portal-footer";
import { ProgressStepper } from "@/components/simulation/income-tax/shared/progress-stepper";
import { EPANAadhaarForm } from "@/components/simulation/income-tax/epan-registration/epan-aadhaar-form";
import { EPANConsentOtp } from "@/components/simulation/income-tax/epan-registration/epan-consent-otp";
import { EPANValidateDetails } from "@/components/simulation/income-tax/epan-registration/epan-validate-details";
import { EPANConfirmSubmit } from "@/components/simulation/income-tax/epan-registration/epan-confirm-submit";
import { EvaluationPopup } from "@/components/simulation/income-tax/shared/evaluation-results";
import { type EvaluationMapping } from "@/lib/evaluation";
import { createClient } from "@/lib/supabase/client";
import { type EPANAadhaarDetails } from "@/components/simulation/income-tax/epan-registration/types";
import { VALIDATION_REGEX } from "@/lib/simulation/income-tax/epan-registration/constants";

type EPANSeedFieldKey = "fullName" | "dob" | "gender" | "mobile" | "email" | "address";
const EPAN_MAPPING_CACHE_PREFIX = "epan-simulation-mappings:";

interface SimulationFieldRecord {
    field_name: string;
    expected_value: string | null;
    field_label: string | null;
}

function getCachedMappings(questionId: string | null): EvaluationMapping[] {
    if (typeof window === "undefined" || !questionId) {
        return [];
    }

    try {
        const raw = window.localStorage.getItem(`${EPAN_MAPPING_CACHE_PREFIX}${questionId}`);
        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw) as EvaluationMapping[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function EPANSimulationContent() {
    const searchParams = useSearchParams();
    const questionId = searchParams.get("questionId");
    const [showEvaluationPopup, setShowEvaluationPopup] = useState(false);
    const { 
        data,
        currentStep, 
        isCompleted, 
        evaluationResults, 
        aadhaarOtpState,
        emailOtpState,
        updateData,
        updateAadhaarOtp,
        updateEmailOtp,
        evaluationMappings,
        nextStep,
        prevStep,
        completeEPAN
    } = useEPAN();
    const completedSteps = useMemo(() => {
        if (isCompleted || currentStep >= 4) {
            return EPAN_STEPS.map((step) => step.number);
        }

        return EPAN_STEPS
            .filter((step) => step.number < currentStep)
            .map((step) => step.number);
    }, [currentStep, isCompleted]);

    const aadhaarDetails: EPANAadhaarDetails = useMemo(() => ({
        aadhaarNumber:
            data.aadhaarNumber.length === 12
                ? `**** ****${data.aadhaarNumber.slice(-3)}`
                : data.aadhaarNumber,
        name: data.fullName,
        dateOfBirth: data.dob,
        gender: data.gender,
        mobileNumber: data.mobile,
        email: data.email,
        address: data.address,
    }), [data]);

    useEffect(() => {
        if (currentStep === 4 && !isCompleted) {
            completeEPAN();
        }
    }, [completeEPAN, currentStep, isCompleted]);

    useEffect(() => {
        if (isCompleted && evaluationResults) {
            const timer = window.setTimeout(() => {
                setShowEvaluationPopup(true);
            }, 0);

            return () => window.clearTimeout(timer);
        }
    }, [evaluationResults, isCompleted]);

    const aadhaarValidationError =
        data.aadhaarNumber.length > 0 && !VALIDATION_REGEX.AADHAAR.test(data.aadhaarNumber)
            ? "Please enter the valid 12 digit Aadhaar number."
            : undefined;

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <EPANAadhaarForm 
                        aadhaarNumber={data.aadhaarNumber}
                        checkboxChecked={data.consentAccepted}
                        validationError={aadhaarValidationError}
                        onAadhaarChange={(val) => updateData({ aadhaarNumber: val })}
                        onCheckboxChange={(val) => updateData({ consentAccepted: val })}
                        onContinue={nextStep}
                        onCancel={() => window.history.back()}
                    />
                );
            case 2:
                const isOtpMode = data.uidaiConsent;
                const handleStep2Continue = () => {
                    if (!data.uidaiConsent) {
                        updateData({ uidaiConsent: true, otpConsentAccepted: false });
                    } else {
                        // Seed data from evaluation mappings before going to step 3
                        const seededData: Partial<Record<EPANSeedFieldKey, string>> = {
                            // Default sample values for empty fields as requested by USER
                            fullName: "Priya Nambiar",
                            dob: "01/01/1990",
                            gender: "Female",
                            mobile: "9876543210",
                            email: "priya.nambiar@example.com",
                            address: "123, Sector 4, Lotus Valley, Bengaluru, KA - 560001"
                        };
                        const relevantFields: EPANSeedFieldKey[] = ["fullName", "dob", "gender", "mobile", "email", "address"];
                        evaluationMappings.forEach(m => {
                            if (relevantFields.includes(m.fieldPath as EPANSeedFieldKey) && m.expectedValue) {
                                seededData[m.fieldPath as EPANSeedFieldKey] = m.expectedValue;
                            }
                        });
                        updateData(seededData);
                        nextStep();
                    }
                };

                return (
                    <EPANConsentOtp 
                        mode={isOtpMode ? "otp" : "consent"}
                        consentAccepted={data.otpConsentAccepted}
                        otpState={aadhaarOtpState}
                        onConsentChange={(val) => updateData(
                            isOtpMode
                                ? { otpConsentAccepted: val }
                                : { uidaiConsent: val }
                        )}
                        onOtpChange={updateAadhaarOtp}
                        onContinue={handleStep2Continue}
                        onCancel={prevStep}
                        onResend={() => console.log("Resend Aadhaar OTP")}
                    />
                );
            case 3:
                return (
                    <EPANValidateDetails 
                        details={aadhaarDetails}
                        acceptanceChecked={data.detailsAccepted}
                        emailValidated={data.emailVerified}
                        onAcceptanceChange={(val) => updateData({ detailsAccepted: val })}
                        onContinue={nextStep}
                        onCancel={prevStep}
                        emailOtpState={data.emailVerified ? null : emailOtpState}
                        onEmailOtpChange={updateEmailOtp}
                        onValidateEmail={() => console.log("Validate Email")}
                        onSubmitEmailOtp={() => updateData({ emailVerified: true })}
                    />
                );
            case 4:
                return (
                    <EPANConfirmSubmit 
                        summary={{
                            acknowledgementNumber: "210456789012345",
                            successMessage: "Your request for e-PAN has been submitted successfully"
                        }}
                        onLogin={() => window.location.href = "/simulation/gateway"}
                        onViewEvaluation={() => setShowEvaluationPopup(true)}
                    />
                );
            default:
                return null;
        }
    };

    if (!questionId) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-xl font-semibold">No question specified. Please return to LMS.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f4f5fb] flex flex-col font-sans">
            <PortalHeader />
            
            <main className="flex-grow epan-page-shell">
                <ProgressStepper 
                    steps={EPAN_STEPS.map(s => ({ number: s.number, label: s.label }))} 
                    currentStep={currentStep}
                    completedSteps={completedSteps}
                    className="epan-stepper"
                    stepClassName="epan-step"
                    rowClassName="epan-step-row"
                    numberClassName="epan-step-number"
                    labelClassName="epan-step-label"
                    connectorClassName="epan-step-connector"
                />
                
                <div className="epan-stage-content">
                    {currentStep === 1 && (
                        <div className="epan-heading-row">
                            <h1 className="epan-page-title">Get New e-PAN</h1>
                            <p className="epan-mandatory-note"><span>*</span> Indicates mandatory fields</p>
                        </div>
                    )}
                    {renderStep()}
                </div>
            </main>

            <PortalFooter />

            <EvaluationPopup
                open={showEvaluationPopup}
                results={evaluationResults}
                onClose={() => setShowEvaluationPopup(false)}
            />
        </div>
    );
}

export default function EPANSimulationPage() {
    return (
        <Suspense fallback={<div>Loading simulation...</div>}>
            <EPANProviderWrapper />
        </Suspense>
    );
}

function EPANProviderWrapper() {
    const searchParams = useSearchParams();
    const questionId = searchParams.get("questionId");

    return <EPANProviderLoader key={questionId ?? "missing-question"} questionId={questionId} />;
}

function EPANProviderLoader({ questionId }: { questionId: string | null }) {
    const [mappings, setMappings] = useState<EvaluationMapping[]>(() => getCachedMappings(questionId));

    useEffect(() => {
        async function fetchMappings() {
            if (!questionId) return;
            
            const supabase = createClient();
            try {
                // 1. Get the task for this question
                const { data: tasks } = await supabase
                    .from("simulation_tasks")
                    .select("id")
                    .eq("question_id", questionId)
                    .limit(1);

                if (tasks && tasks.length > 0) {
                    const taskId = tasks[0].id;

                    // 2. Get all steps for this task
                    const { data: steps } = await supabase
                        .from("simulation_steps")
                        .select("id")
                        .eq("task_id", taskId);

                    if (steps && steps.length > 0) {
                        const stepIds = steps.map(s => s.id);

                        // 3. Get all fields for these steps
                        const { data: fields, error: fieldsError } = await supabase
                            .from("simulation_fields")
                            .select("field_name, expected_value, field_label")
                            .in("step_id", stepIds);

                        if (fieldsError) throw fieldsError;

                        if (fields) {
                            const formattedMappings: EvaluationMapping[] = (fields as SimulationFieldRecord[]).map((f) => ({
                                fieldPath: f.field_name,
                                expectedValue: f.expected_value || "",
                                label: f.field_label || f.field_name,
                                weight: 1
                            }));
                            setMappings(formattedMappings);
                            try {
                                window.localStorage.setItem(
                                    `${EPAN_MAPPING_CACHE_PREFIX}${questionId}`,
                                    JSON.stringify(formattedMappings),
                                );
                            } catch {
                                // ignore storage errors
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching evaluation mappings:", err);
            }
        }

        fetchMappings();
    }, [questionId]);

    return (
        <EPANProvider initialMappings={mappings}>
            <EPANSimulationContent />
        </EPANProvider>
    );
}
