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

interface SimulationFieldRecord {
    field_name: string;
    expected_value: string | null;
    field_label: string | null;
}

function EPANSimulationContent() {
    const searchParams = useSearchParams();
    const questionId = searchParams.get("questionId");
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

    const aadhaarDetails: EPANAadhaarDetails = useMemo(() => ({
        aadhaarNumber:
            data.aadhaarNumber.length === 12
                ? `**** ****${data.aadhaarNumber.slice(-3)}`
                : data.aadhaarNumber,
        name: data.fullName || "ASHOK KUMAR",
        dateOfBirth: data.dob || "01-01-1980",
        gender: data.gender || "MALE",
        mobileNumber: data.mobile || "99******00",
        email: data.email || "ashok@example.com",
        address: data.address || "123, Street Name, City, State - 123456",
    }), [data]);

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
                const handleStep2Continue = () => {
                    if (!data.uidaiConsent) {
                        updateData({ uidaiConsent: true });
                    } else {
                        // Seed data from evaluation mappings before going to step 3
                        const seededData: Partial<Record<EPANSeedFieldKey, string>> = {};
                        const relevantFields: EPANSeedFieldKey[] = ["fullName", "dob", "gender", "mobile", "email", "address"];
                        evaluationMappings.forEach(m => {
                            if (relevantFields.includes(m.fieldPath as EPANSeedFieldKey)) {
                                seededData[m.fieldPath as EPANSeedFieldKey] = m.expectedValue;
                            }
                        });
                        if (Object.keys(seededData).length > 0) {
                            updateData(seededData);
                        }
                        nextStep();
                    }
                };

                return (
                    <EPANConsentOtp 
                        mode={data.uidaiConsent ? "otp" : "consent"}
                        consentAccepted={data.uidaiConsent}
                        otpState={aadhaarOtpState}
                        onConsentChange={(val) => updateData({ uidaiConsent: val })}
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
                        onLogin={() => completeEPAN()}
                        onViewEvaluation={() => completeEPAN()}
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
                open={isCompleted}
                results={evaluationResults}
                onClose={() => window.location.href = "/course/e-pan-registration"}
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
    const [mappings, setMappings] = useState<EvaluationMapping[]>([]);
    const [loading, setLoading] = useState(true);

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
                        }
                    }
                }
            } catch (err) {
                console.error("Error fetching evaluation mappings:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchMappings();
    }, [questionId]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading simulation...</div>;
    }

    return (
        <EPANProvider initialMappings={mappings}>
            <EPANSimulationContent />
        </EPANProvider>
    );
}
