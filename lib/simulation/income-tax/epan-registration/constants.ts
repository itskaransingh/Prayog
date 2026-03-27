export type EPANStepNumber = 1 | 2 | 3 | 4;

export interface EPANStep {
    number: EPANStepNumber;
    label: string;
}

export const EPAN_STEPS: readonly EPANStep[] = [
    { number: 1, label: "Enter Aadhaar\nNumber" },
    { number: 2, label: "OTP Validation" },
    { number: 3, label: "Validate Aadhaar\nDetails" },
    { number: 4, label: "Select & Update\nPAN Details" },
] as const;

export const VALIDATION_REGEX = {
    AADHAAR: /^\d{12}$/,
    OTP: /^\d{6}$/,
};

export type EPANData = {
    aadhaarNumber: string;
    consentAccepted: boolean;
    aadhaarOtp: string;
    uidaiConsent: boolean;
    fullName: string;
    dob: string;
    gender: string;
    mobile: string;
    email: string;
    address: string;
    emailOtp: string;
    emailVerified: boolean;
    detailsAccepted: boolean;
};
