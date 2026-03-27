"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    type ReactNode,
} from "react";
import { type EPANData, type EPANStepNumber } from "./constants";
import { type EPANOtpState } from "@/components/simulation/income-tax/epan-registration/types";
import { evaluateRegistration, type EvaluationResult, type EvaluationMapping } from "@/lib/evaluation";

// ---------- Context Shape ----------

interface EPANContextValue {
    data: EPANData;
    currentStep: EPANStepNumber;
    startTime: number | null;
    evaluationMappings: EvaluationMapping[];
    evaluationResults: EvaluationResult | null;
    transactionId: string | null;
    isCompleted: boolean;
    aadhaarOtpState: EPANOtpState;
    emailOtpState: EPANOtpState;
    updateData: (partial: Partial<EPANData>) => void;
    updateAadhaarOtp: (digits: string[]) => void;
    updateEmailOtp: (digits: string[]) => void;
    goToStep: (step: EPANStepNumber) => void;
    nextStep: () => void;
    prevStep: () => void;
    completeEPAN: () => void;
}

const EPANContext = createContext<EPANContextValue | null>(null);
const EVALUATION_STORAGE_KEY = "epan-registration-evaluation-mappings";

// ---------- Initial State ----------

const INITIAL_DATA: EPANData = {
    aadhaarNumber: "",
    consentAccepted: false,
    aadhaarOtp: "",
    uidaiConsent: false,
    fullName: "",
    dob: "",
    gender: "",
    mobile: "",
    email: "",
    address: "",
    emailOtp: "",
    emailVerified: false,
    detailsAccepted: false,
};

// ---------- Provider ----------

const INITIAL_OTP_STATE: EPANOtpState = {
    digits: ["", "", "", "", "", ""],
    maskedTarget: "+91 23******71",
    codeHint: "123456",
    timerText: "OTP expires in 14m:52s",
    attemptsText: "3 Attempts remaining",
    canResend: false,
};

export function EPANProvider({
    children,
    initialMappings,
}: {
    children: ReactNode;
    initialMappings?: EvaluationMapping[];
}) {
    const [data, setData] = useState<EPANData>(INITIAL_DATA);
    const [currentStep, setCurrentStep] = useState<EPANStepNumber>(1);
    const [startTime] = useState<number | null>(() =>
        typeof window === "undefined" ? null : Date.now()
    );
    const [evaluationMappings] = useState<EvaluationMapping[]>(() => {
        if (initialMappings && initialMappings.length > 0) {
            return initialMappings;
        }

        if (typeof window === "undefined") {
            return [];
        }

        const storedEvaluation = window.localStorage.getItem(EVALUATION_STORAGE_KEY);
        if (!storedEvaluation) {
            return [];
        }

        try {
            const parsed = JSON.parse(storedEvaluation) as {
                mappings?: EvaluationMapping[];
            };
            return parsed.mappings ?? [];
        } catch {
            return [];
        }
    });
    const [evaluationResults, setEvaluationResults] = useState<EvaluationResult | null>(null);
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const [aadhaarOtpState, setAadhaarOtpState] = useState<EPANOtpState>(INITIAL_OTP_STATE);
    const [emailOtpState, setEmailOtpState] = useState<EPANOtpState>(INITIAL_OTP_STATE);

    // Persist "started" while the learner is in the flow.
    useEffect(() => {
        if (currentStep === 1 && startTime) {
            try {
                window.localStorage.setItem("epan-registration-started", "true");
            } catch {
                // ignore storage errors
            }
        }
    }, [currentStep, startTime]);

    // Clear any persisted completion marker on refresh to allow a fresh attempt.
    useEffect(() => {
        const completed = localStorage.getItem("epan-registration-completed");

        if (completed === "true") {
            localStorage.removeItem("epan-registration-completed");
            localStorage.removeItem("epan-registration-started");
        }
    }, []);

    const updateData = useCallback((partial: Partial<EPANData>) => {
        setData((prev) => ({ ...prev, ...partial }));
    }, []);

    const updateAadhaarOtp = useCallback((digits: string[]) => {
        setAadhaarOtpState((prev) => ({ ...prev, digits }));
        setData((prev) => ({ ...prev, aadhaarOtp: digits.join("") }));
    }, []);

    const updateEmailOtp = useCallback((digits: string[]) => {
        setEmailOtpState((prev) => ({ ...prev, digits }));
        setData((prev) => ({ ...prev, emailOtp: digits.join("") }));
    }, []);

    const goToStep = useCallback((step: EPANStepNumber) => {
        setCurrentStep(step);
    }, []);

    const nextStep = useCallback(() => {
        setCurrentStep((prev) => Math.min(prev + 1, 4) as EPANStepNumber);
    }, []);

    const prevStep = useCallback(() => {
        setCurrentStep((prev) => Math.max(prev - 1, 1) as EPANStepNumber);
    }, []);

    const completeEPAN = useCallback(() => {
        if (!startTime) return;

        const endTime = Date.now();
        // Note: evaluateRegistration needs to be generic or we need a new function.
        // For now using cast to satisfy types if it's strictly typed to RegistrationData.
        const results = evaluateRegistration(
            data as Record<string, unknown>,
            startTime,
            endTime,
            evaluationMappings
        );

        // Generate a simple unique transaction ID
        const txId = "EPAN" + Math.random().toString(36).substring(2, 10).toUpperCase();

        setEvaluationResults(results);
        setTransactionId(txId);
        setIsCompleted(true);
        localStorage.setItem("epan-registration-completed", "true");
    }, [data, evaluationMappings, startTime]);

    return (
        <EPANContext.Provider
            value={{
                data,
                currentStep,
                startTime,
                evaluationMappings,
                evaluationResults,
                transactionId,
                isCompleted,
                aadhaarOtpState,
                emailOtpState,
                updateData,
                updateAadhaarOtp,
                updateEmailOtp,
                goToStep,
                nextStep,
                prevStep,
                completeEPAN,
            }}
        >
            {children}
        </EPANContext.Provider>
    );
}

// ---------- Hook ----------

export function useEPAN() {
    const ctx = useContext(EPANContext);
    if (!ctx) {
        throw new Error(
            "useEPAN must be used within a EPANProvider"
        );
    }
    return ctx;
}
