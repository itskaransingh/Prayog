export const GSTIN_SUBMODULE_ID = "42173d58-c1b7-41a1-a1fe-5deeafa19cf2";

export const GSTIN_CONSTITUTION_OPTIONS = [
    "Foreign Company",
    "Foreign Limited Liability Partnership",
    "Government Department",
    "Hindu Undivided Family",
    "Limited Liability Partnership",
    "Local Authority",
    "Others",
    "Partnership",
    "Private Limited Company",
    "Proprietorship",
    "Public Limited Company",
    "Public Sector Undertaking",
    "Society/Club/Trust/AOP",
    "Statutory Body",
    "Unlimited Company",
] as const;

export const GSTIN_REASON_OPTIONS = [
    "Crossing the Threshold",
    "Inter-State supply",
    "Liability to pay as recipient of goods or services",
    "Transfer / Succession of business",
    "Death of the Proprietor",
    "De-merger",
    "Change in constitution of business",
    "Merger /Amalgamation",
    "E-Commerce Operator",
    "Selling through e-Commerce portal",
    "Voluntary Basis",
    "Input Service Distributor only",
    "Supplies on behalf of other taxable Person",
    "SEZ Unit",
    "SEZ Developer",
    "Others",
    "Corporate Debtor undergoing the Corporate Insolvency Resolution Process with IRP/RP",
] as const;

export const GSTIN_DESIGNATION_OPTIONS = [
    "Proprietor",
    "Partner",
    "Managing Director",
    "Director",
    "Manager",
    "Authorized Signatory",
    "Company Secretary",
    "Chief Executive Officer",
    "Others",
] as const;

export const GSTIN_NATURE_OF_POSSESSION_OPTIONS = [
    "Consent",
    "Leased",
    "Others",
    "Own",
    "Rented",
    "Shared",
] as const;

// Document options for PPOB (Tab 5)
export const GSTIN_PPOB_DOCUMENT_OPTIONS = [
    "Electricity Bill",
    "Legal ownership document",
    "Municipal Khata Copy",
    "Property Tax Receipt",
] as const;

// Document options for Authorized Signatory proof (Tab 3)
export const GSTIN_SIGNATORY_DOCUMENT_OPTIONS = [
    "Letter of Authorisation",
    "Copy of resolution passed by BoD / Managing Committee",
] as const;

// Keep old export name as alias for backward compatibility
export const GSTIN_DOCUMENT_TYPE_OPTIONS = GSTIN_PPOB_DOCUMENT_OPTIONS;

export const GSTIN_EXISTING_REG_TYPE_OPTIONS = [
    "GSTIN",
    "Temporary ID",
    "Registration Number under Value Added Tax (TIN)",
    "Central Sales Tax Registration Number",
    "Central Excise Registration Number",
    "Service Tax Registration Number",
    "Importer/Exporter Code Number",
    "Entry Tax Registration Number",
    "Entertainment Tax Registration Number",
    "Hotel And Luxury Tax Registration Number",
    "Corporate Identity Number / Foreign Company Registration Number",
    "Limited Liability Partnership / Foreign Limited Liability Partnership Identification Number",
    "Registration number under Medicinal and Toilet Preparations (Excise Duties) Act",
    "Registration under Shops and Establishment Act",
    "Others (Please specify)",
] as const;

export type GstinFieldPath =
    | "trn"
    | "captcha"
    | "otp"
    | "legalBusinessName"
    | "tradeName"
    | "registeredState"
    | "registeredDistrict"
    | "constitutionOfBusiness"
    | "dateOfCommencement"
    | "reasonForRegistration"
    | "ward"
    | "commissionerate"
    | "division"
    | "range"
    | "proprietorFirstName"
    | "proprietorFatherFirstName"
    | "proprietorDob"
    | "proprietorMobile"
    | "proprietorEmail"
    | "proprietorPan"
    | "proprietorAadhaar"
    | "proprietorDesignation"
    | "residentialFlatNo"
    | "residentialFloor"
    | "residentialBuilding"
    | "residentialStreet"
    | "residentialCity"
    | "residentialDistrict"
    | "residentialState"
    | "residentialPin"
    | "businessFlatNo"
    | "businessBuilding"
    | "businessFloor"
    | "businessStreet"
    | "businessCity"
    | "businessDistrict"
    | "businessState"
    | "businessPin"
    | "businessEmail"
    | "hsn"
    | "verificationName"
    | "verificationPlace";

export interface GstinRegistrationData {
    // Step 1 — TRN entry
    trn: string;
    captcha: string;
    // Step 2 — OTP
    otp: string;
    // TRN-derived readonly fields
    legalBusinessName: string;
    registeredState: string;
    registeredDistrict: string;
    // Tab 1 — Business Details
    constitutionOfBusiness: string;
    dateOfCommencement: string;
    reasonForRegistration: string;
    ward: string;
    commissionerate: string;
    division: string;
    range: string;
    // Tab 2 — Promoters
    proprietorFirstName: string;
    proprietorFatherFirstName: string;
    proprietorDob: string;
    proprietorMobile: string;
    proprietorEmail: string;
    proprietorPan: string;
    proprietorAadhaar: string;
    proprietorDesignation: string;
    residentialFlatNo: string;
    residentialFloor: string;
    residentialBuilding: string;
    residentialStreet: string;
    residentialCity: string;
    residentialDistrict: string;
    residentialState: string;
    residentialPin: string;
    // Tab 5 — Principal Place of Business
    businessFlatNo: string;
    businessBuilding: string;
    businessFloor: string;
    businessStreet: string;
    businessCity: string;
    businessDistrict: string;
    businessState: string;
    businessPin: string;
    businessEmail: string;
    // Tab 7 — Goods and Services
    hsn: string;
    // Tab 10 — Verification
    verificationName: string;
    verificationPlace: string;
    // Non-evaluated UI-only state
    tradeName: string;
    residentialCountry: string;
    gender: string;
    businessNature: string[];
    natureOfPossession: string;
    aadhaarAuthEnabled: boolean;
}

export const EMPTY_GSTIN_REGISTRATION_DATA: GstinRegistrationData = {
    trn: "",
    captcha: "",
    otp: "",
    legalBusinessName: "",
    registeredState: "",
    registeredDistrict: "",
    constitutionOfBusiness: "",
    dateOfCommencement: "",
    reasonForRegistration: "",
    ward: "",
    commissionerate: "",
    division: "",
    range: "",
    proprietorFirstName: "",
    proprietorFatherFirstName: "",
    proprietorDob: "",
    proprietorMobile: "",
    proprietorEmail: "",
    proprietorPan: "",
    proprietorAadhaar: "",
    proprietorDesignation: "Proprietor",
    residentialFlatNo: "",
    residentialFloor: "",
    residentialBuilding: "",
    residentialStreet: "",
    residentialCity: "",
    residentialDistrict: "",
    residentialState: "",
    residentialPin: "",
    businessFlatNo: "",
    businessBuilding: "",
    businessFloor: "",
    businessStreet: "",
    businessCity: "",
    businessDistrict: "",
    businessState: "",
    businessPin: "",
    businessEmail: "",
    hsn: "",
    verificationName: "",
    verificationPlace: "",
    tradeName: "",
    residentialCountry: "India",
    gender: "Male",
    businessNature: [],
    natureOfPossession: "",
    aadhaarAuthEnabled: false,
};

function normalizeLabel(label: string): string {
    return label
        .toLowerCase()
        .replace(/\(.*?\)/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

const GSTIN_FIELD_PATH_BY_LABEL = new Map<string, GstinFieldPath>([
    ["temporary reference number", "trn"],
    ["trn number", "trn"],
    ["captcha code", "captcha"],
    ["captcha", "captcha"],
    ["otp", "otp"],
    ["mobile email otp", "otp"],
    ["mobile otp", "otp"],
    ["email otp", "otp"],
    ["legal name of the business", "legalBusinessName"],
    ["legal name of the business as mentioned in pan", "legalBusinessName"],
    ["trade name", "tradeName"],
    ["name of the state", "registeredState"],
    ["state", "registeredState"],
    ["state ut", "registeredState"],
    ["district", "registeredDistrict"],
    ["registered district", "registeredDistrict"],
    ["constitution of business", "constitutionOfBusiness"],
    ["date of commencement of business", "dateOfCommencement"],
    ["commencement date", "dateOfCommencement"],
    ["reason to obtain registration", "reasonForRegistration"],
    ["reason for registration", "reasonForRegistration"],
    ["ward", "ward"],
    ["ward circle charge unit", "ward"],
    ["commissionerate", "commissionerate"],
    ["division", "division"],
    ["range", "range"],
    ["promoter first name", "proprietorFirstName"],
    ["first name", "proprietorFirstName"],
    ["father first name", "proprietorFatherFirstName"],
    ["date of birth", "proprietorDob"],
    ["promoter mobile number", "proprietorMobile"],
    ["mobile number", "proprietorMobile"],
    ["promoter email address", "proprietorEmail"],
    ["email address", "proprietorEmail"],
    ["pan", "proprietorPan"],
    ["pan number", "proprietorPan"],
    ["permanent account number pan", "proprietorPan"],
    ["aadhaar number", "proprietorAadhaar"],
    ["designation status", "proprietorDesignation"],
    ["residential flat no", "residentialFlatNo"],
    ["residential floor no", "residentialFloor"],
    ["residential building name", "residentialBuilding"],
    ["residential street road", "residentialStreet"],
    ["residential city", "residentialCity"],
    ["residential district", "residentialDistrict"],
    ["residential state", "residentialState"],
    ["residential pin code", "residentialPin"],
    ["business flat no", "businessFlatNo"],
    ["business building name", "businessBuilding"],
    ["business floor no", "businessFloor"],
    ["business street road", "businessStreet"],
    ["business city", "businessCity"],
    ["business district", "businessDistrict"],
    ["business state", "businessState"],
    ["business pin code", "businessPin"],
    ["business email address", "businessEmail"],
    ["office email address", "businessEmail"],
    ["hsn code", "hsn"],
    ["products hsn", "hsn"],
    ["verification signatory name", "verificationName"],
    ["name of authorized signatory", "verificationName"],
    ["verification place", "verificationPlace"],
    ["place", "verificationPlace"],
]);

export function getGstinFieldPathFromLabel(
    label: string | null | undefined,
    index?: number,
): string {
    const normalized = normalizeLabel(label ?? "");
    const matched = GSTIN_FIELD_PATH_BY_LABEL.get(normalized);

    if (matched) {
        return matched;
    }

    return `gstinField${typeof index === "number" ? index + 1 : ""}`;
}
