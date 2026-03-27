export interface EPANStep {
    number: 1 | 2 | 3 | 4;
    label: string;
}

export interface EPANOtpState {
    digits: string[];
    maskedTarget?: string;
    codeHint?: string;
    timerText?: string;
    attemptsText?: string;
    resendText?: string;
    canResend?: boolean;
}

export interface EPANAadhaarDetails {
    photoAlt?: string;
    aadhaarNumber: string;
    name: string;
    dateOfBirth: string;
    gender: string;
    mobileNumber: string;
    email: string;
    address: string;
}

export interface EPANConfirmSummary {
    acknowledgementNumber: string;
    successMessage?: string;
    helperText?: string;
}

export const EPAN_STEPS: readonly EPANStep[] = [
    { number: 1, label: "Enter Aadhaar\nNumber" },
    { number: 2, label: "OTP Validation" },
    { number: 3, label: "Validate Aadhaar\nDetails" },
    { number: 4, label: "Select & Update\nPAN Details" },
] as const;
