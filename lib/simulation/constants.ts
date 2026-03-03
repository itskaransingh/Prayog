// ============================================================
// Simulation Constants — Registration Flow
// ============================================================

/** Step definitions for the registration progress stepper */
export const REGISTRATION_STEPS = [
    { number: 1, label: "Get Started" },
    { number: 2, label: "Fill Details" },
    { number: 3, label: "Verify Details" },
    { number: 4, label: "Secure Your Account" },
] as const;

export type StepNumber = 1 | 2 | 3 | 4;

/** Ground-truth evaluation data from the case study (Rajesh Kumar) */
export const GROUND_TRUTH = {
    registerAs: "taxpayer" as const,
    pan: "ABCPK1234D",
    personalDetails: {
        firstName: "Rajesh",
        middleName: "",
        lastName: "Kumar",
        dob: "15/08/1993",
        gender: "Male" as const,
    },
    addressDetails: {
        flatDoorNo: "Flat 302",
        building: "Prestige Towers",
        road: "Koramangala",
        area: "Koramangala",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560034",
    },
    contactDetails: {
        mobile: "9876543210",
        email: "rajesh.kumar@email.com",
        alternateContact: "",
    },
    employer: "Infosys Ltd.",
} as const;

// ---------- Validation Regex ----------

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
export const MOBILE_REGEX = /^[6-9][0-9]{9}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const DOB_REGEX = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

// ---------- Indian States ----------

export const INDIAN_STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry",
] as const;
