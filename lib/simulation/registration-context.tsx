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
import { evaluateRegistration, type EvaluationResult } from "../evaluation";

// ---------- Data Types ----------

export interface PersonalDetails {
    firstName: string;
    middleName: string;
    lastName: string;
    dob: string;
    gender: "Male" | "Female" | "Other" | "";
}

export interface AddressDetails {
    flatDoorNo: string;
    building: string;
    road: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
}

export interface ContactDetails {
    mobile: string;
    email: string;
    alternateContact: string;
}

export interface RegistrationData {
    // Step 1
    registerAs: "taxpayer" | "others";
    pan: string;
    // Step 2
    personalDetails: PersonalDetails;
    addressDetails: AddressDetails;
    contactDetails: ContactDetails;
    employer: string;
}

// ---------- Context Shape ----------

interface RegistrationContextValue {
    data: RegistrationData;
    currentStep: StepNumber;
    startTime: number | null;
    evaluationResults: EvaluationResult | null;
    isCompleted: boolean;
    updateData: (partial: Partial<RegistrationData>) => void;
    goToStep: (step: StepNumber) => void;
    nextStep: () => void;
    prevStep: () => void;
    completeRegistration: () => void;
}

const RegistrationContext = createContext<RegistrationContextValue | null>(null);

// ---------- Initial State ----------

const INITIAL_DATA: RegistrationData = {
    registerAs: "taxpayer",
    pan: "",
    personalDetails: {
        firstName: "",
        middleName: "",
        lastName: "",
        dob: "",
        gender: "",
    },
    addressDetails: {
        flatDoorNo: "",
        building: "",
        road: "",
        area: "",
        city: "",
        state: "",
        pincode: "",
    },
    contactDetails: {
        mobile: "",
        email: "",
        alternateContact: "",
    },
    employer: "",
};

// ---------- Provider ----------

export function RegistrationProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<RegistrationData>(INITIAL_DATA);
    const [currentStep, setCurrentStep] = useState<StepNumber>(1);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [evaluationResults, setEvaluationResults] = useState<EvaluationResult | null>(null);
    const [isCompleted, setIsCompleted] = useState(false);

    // Set start time when the user starts Step 1
    useEffect(() => {
        if (currentStep === 1 && !startTime) {
            setStartTime(Date.now());
        }
    }, [currentStep, startTime]);

    // Check localStorage for completion on mount
    useEffect(() => {
        const completed = localStorage.getItem("itr-registration-completed");
        if (completed === "true") {
            setIsCompleted(true);
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
        const results = evaluateRegistration(data, startTime, endTime);
        setEvaluationResults(results);
        setIsCompleted(true);
        localStorage.setItem("itr-registration-completed", "true");
    }, [data, startTime]);

    return (
        <RegistrationContext.Provider
            value={{
                data,
                currentStep,
                startTime,
                evaluationResults,
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
