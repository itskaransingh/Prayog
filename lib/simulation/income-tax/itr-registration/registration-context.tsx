"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    type ReactNode,
} from "react";
import type { StepNumber } from "./constants";
import { evaluateRegistration, type EvaluationResult, type EvaluationMapping } from "@/lib/evaluation";

// ---------- Data Types ----------

export interface PersonalDetails {
    firstName: string;
    middleName: string;
    lastName: string;
    dob: string;
    gender: "Male" | "Female" | "Transgender" | "";
    residentialStatus: "Resident" | "Non-resident" | "";
}

export interface AddressDetails {
    flatDoorNo: string;
    road: string;
    area: string;
    postOffice: string;
    city: string;
    state: string;
    pincode: string;
}

export interface ContactDetails {
    mobile: string;
    email: string;
    alternateContact: string;
    mobileBelongsTo: string;
    emailBelongsTo: string;
}

export interface RegistrationData {
    // Step 1
    registerAs: "taxpayer" | "others";
    pan: string;
    individualConfirmation: "yes" | "no" | "";
    // Step 2
    personalDetails: PersonalDetails;
    addressDetails: AddressDetails;
    contactDetails: ContactDetails;
    personalizedMessage: string;
}

// ---------- Context Shape ----------

interface RegistrationContextValue {
    data: RegistrationData;
    currentStep: StepNumber;
    startTime: number | null;
    evaluationMappings: EvaluationMapping[];
    evaluationResults: EvaluationResult | null;
    transactionId: string | null;
    isCompleted: boolean;
    updateData: (partial: Partial<RegistrationData>) => void;
    goToStep: (step: StepNumber) => void;
    nextStep: () => void;
    prevStep: () => void;
    completeRegistration: () => void;
}

export const RegistrationContext = createContext<RegistrationContextValue | null>(null);
const EVALUATION_STORAGE_KEY = "itr-registration-evaluation-mappings";

// ---------- Initial State ----------

const INITIAL_DATA: RegistrationData = {
    registerAs: "taxpayer",
    pan: "",
    individualConfirmation: "",
    personalDetails: {
        firstName: "",
        middleName: "",
        lastName: "",
        dob: "",
        gender: "",
        residentialStatus: "",
    },
    addressDetails: {
        flatDoorNo: "",
        road: "",
        area: "",
        postOffice: "",
        city: "",
        state: "",
        pincode: "",
    },
    contactDetails: {
        mobile: "",
        email: "",
        alternateContact: "",
        mobileBelongsTo: "",
        emailBelongsTo: "",
    },
    personalizedMessage: "",
};

// ---------- Provider ----------

export function RegistrationProvider({
    children,
    initialMappings,
}: {
    children: ReactNode;
    initialMappings?: EvaluationMapping[];
}) {
    const [data, setData] = useState<RegistrationData>(INITIAL_DATA);
    const [currentStep, setCurrentStep] = useState<StepNumber>(1);
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

    // Persist "started" while the learner is in the flow.
    useEffect(() => {
        if (currentStep === 1 && startTime) {
            try {
                window.localStorage.setItem("itr-registration-started", "true");
            } catch {
                // ignore storage errors
            }
        }
    }, [currentStep, startTime]);

    // Clear any persisted completion marker on refresh to allow a fresh attempt.
    useEffect(() => {
        const completed = localStorage.getItem("itr-registration-completed");

        if (completed === "true") {
            localStorage.removeItem("itr-registration-completed");
            localStorage.removeItem("itr-registration-started");
        }
    }, []);

    const updateData = useCallback((partial: Partial<RegistrationData>) => {
        setData((prev) => ({ ...prev, ...partial }));
    }, []);

    const goToStep = useCallback((step: StepNumber) => {
        setCurrentStep(step);
    }, []);

    const nextStep = useCallback(() => {
        setCurrentStep((prev) => Math.min(prev + 1, 4) as StepNumber);
    }, []);

    const prevStep = useCallback(() => {
        setCurrentStep((prev) => Math.max(prev - 1, 1) as StepNumber);
    }, []);

    const completeRegistration = useCallback(() => {
        if (!startTime) return;

        const endTime = Date.now();
        const results = evaluateRegistration(
            data,
            startTime,
            endTime,
            evaluationMappings
        );

        // Generate a simple unique transaction ID
        const txId = "REG" + Math.random().toString(36).substring(2, 10).toUpperCase();

        setEvaluationResults(results);
        setTransactionId(txId);
        setIsCompleted(true);
        localStorage.setItem("itr-registration-completed", "true");
    }, [data, evaluationMappings, startTime]);

    return (
        <RegistrationContext.Provider
            value={{
                data,
                currentStep,
                startTime,
                evaluationMappings,
                evaluationResults,
                transactionId,
                isCompleted,
                updateData,
                goToStep,
                nextStep,
                prevStep,
                completeRegistration,
            }}
        >
            {children}
        </RegistrationContext.Provider>
    );
}

// ---------- Hook ----------

export function useRegistration() {
    const ctx = useContext(RegistrationContext);
    if (!ctx) {
        throw new Error(
            "useRegistration must be used within a RegistrationProvider"
        );
    }
    return ctx;
}
