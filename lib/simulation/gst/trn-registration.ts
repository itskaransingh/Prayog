export const TRN_REGISTRATION_TYPE_OPTIONS = [
    "New Registration",
    "Temporary Reference Number (TRN)",
] as const;

export const TRN_TAXPAYER_OPTIONS = [
    "Taxpayer",
    "Tax Deductor",
    "Tax Collector (e-Commerce)",
    "GST Practitioner",
    "Non Resident Taxable Person",
    "United Nation Body",
    "Consulate or Embassy of Foreign Country",
    "Other Notified Person",
    "Non-Resident Online Services Provider",
] as const;

export const TRN_STATE_OPTIONS = [
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
] as const;

export const TRN_DISTRICT_OPTIONS_BY_STATE: Record<string, readonly string[]> = {
    Delhi: [
        "Central",
        "Central North",
        "East",
        "New Delhi",
        "North",
        "North-East",
        "North-West",
        "Old Delhi",
        "Outer North",
        "Shahdara",
        "South",
        "South-East",
        "South-West",
        "West",
    ],
    Gujarat: [
        "Ahmedabad",
        "Amreli",
        "Anand",
        "Aravalli",
        "Banaskantha",
        "Bharuch",
        "Bhavnagar",
        "Botad",
        "Chhota Udaipur",
        "Dahod",
        "Dang",
        "Devbhoomi Dwarka",
        "Gandhinagar",
        "Gir Somnath",
        "Jamnagar",
        "Junagadh",
        "Kheda",
        "Kutch",
        "Mahisagar",
        "Mehsana",
        "Morbi",
        "Narmada",
        "Navsari",
        "Panchmahal",
        "Patan",
        "Porbandar",
        "Rajkot",
        "Sabarkantha",
        "Surat",
        "Surendranagar",
        "Tapi",
        "Vadodara",
        "Valsad",
    ],
    Kerala: [
        "Alappuzha",
        "Ernakulam",
        "Idukki",
        "Kannur",
        "Kasaragod",
        "Kollam",
        "Kottayam",
        "Kozhikode",
        "Malappuram",
        "Palakkad",
        "Pathanamthitta",
        "Thiruvananthapuram",
        "Thrissur",
        "Wayanad",
    ],
    Rajasthan: [
        "Ajmer",
        "Alwar",
        "Banswara",
        "Baran",
        "Barmer",
        "Bharatpur",
        "Bhilwara",
        "Bikaner",
        "Bundi",
        "Chittorgarh",
        "Churu",
        "Dausa",
        "Dholpur",
        "Dungarpur",
        "Ganganagar",
        "Hanumangarh",
        "Jaipur",
        "Jaisalmer",
        "Jalore",
        "Jhalawar",
        "Jhunjhunu",
        "Jodhpur",
        "Karauli",
        "Kota",
        "Nagaur",
        "Pali",
        "Pratapgarh",
        "Rajsamand",
        "Sawai Madhopur",
        "Sikar",
        "Sirohi",
        "Tonk",
        "Udaipur",
    ],
    "Tamil Nadu": [
        "Ariyalur",
        "Chengalpattu",
        "Chennai",
        "Coimbatore",
        "Cuddalore",
        "Dharmapuri",
        "Dindigul",
        "Erode",
        "Kallakurichi",
        "Kanchipuram",
        "Kanyakumari",
        "Karur",
        "Krishnagiri",
        "Madurai",
        "Mayiladuthurai",
        "Nagapattinam",
        "Namakkal",
        "Nilgiris",
        "Perambalur",
        "Pudukkottai",
        "Ramanathapuram",
        "Ranipet",
        "Salem",
        "Sivaganga",
        "Tenkasi",
        "Thanjavur",
        "Theni",
        "Thoothukudi",
        "Tiruchirappalli",
        "Tirunelveli",
        "Tirupathur",
        "Tiruppur",
        "Tiruvallur",
        "Tiruvannamalai",
        "Tiruvarur",
        "Vellore",
        "Viluppuram",
        "Virudhunagar",
    ],
    Telangana: [
        "Adilabad",
        "Bhadradri Kothagudem",
        "Hanumakonda",
        "Hyderabad",
        "Jagtial",
        "Jangaon",
        "Jayashankar Bhupalpally",
        "Jogulamba Gadwal",
        "Kamareddy",
        "Karimnagar",
        "Khammam",
        "Kumuram Bheem",
        "Mahabubabad",
        "Mahabubnagar",
        "Mancherial",
        "Medak",
        "Medchal-Malkajgiri",
        "Mulugu",
        "Nagarkurnool",
        "Nalgonda",
        "Narayanpet",
        "Nirmal",
        "Nizamabad",
        "Peddapalli",
        "Rajanna Sircilla",
        "Rangareddy",
        "Sangareddy",
        "Siddipet",
        "Suryapet",
        "Vikarabad",
        "Wanaparthy",
        "Warangal",
        "Yadadri Bhuvanagiri",
    ],
    "Uttar Pradesh": [
        "Agra",
        "Aligarh",
        "Ambedkar Nagar",
        "Amethi",
        "Amroha",
        "Auraiya",
        "Ayodhya",
        "Azamgarh",
        "Baghpat",
        "Bahraich",
        "Ballia",
        "Balrampur",
        "Banda",
        "Barabanki",
        "Bareilly",
        "Basti",
        "Bhadohi",
        "Bijnor",
        "Budaun",
        "Bulandshahr",
        "Chandauli",
        "Chitrakoot",
        "Deoria",
        "Etah",
        "Etawah",
        "Farrukhabad",
        "Fatehpur",
        "Firozabad",
        "Gautam Buddha Nagar",
        "Ghaziabad",
        "Ghazipur",
        "Gonda",
        "Gorakhpur",
        "Hamirpur",
        "Hapur",
        "Hardoi",
        "Hathras",
        "Jalaun",
        "Jaunpur",
        "Jhansi",
        "Kannauj",
        "Kanpur Dehat",
        "Kanpur Nagar",
        "Kasganj",
        "Kaushambi",
        "Kheri",
        "Kushinagar",
        "Lalitpur",
        "Lucknow",
        "Maharajganj",
        "Mahoba",
        "Mainpuri",
        "Mathura",
        "Mau",
        "Meerut",
        "Mirzapur",
        "Moradabad",
        "Muzaffarnagar",
        "Pilibhit",
        "Pratapgarh",
        "Prayagraj",
        "Raebareli",
        "Rampur",
        "Saharanpur",
        "Sambhal",
        "Sant Kabir Nagar",
        "Shahjahanpur",
        "Shamli",
        "Shrawasti",
        "Siddharthnagar",
        "Sitapur",
        "Sonbhadra",
        "Sultanpur",
        "Unnao",
        "Varanasi",
    ],
};

export type TrnFieldPath =
    | "registrationType"
    | "taxpayerType"
    | "state"
    | "district"
    | "legalBusinessName"
    | "pan"
    | "email"
    | "mobile"
    | "captcha"
    | "mobileOtp"
    | "emailOtp";

export interface TrnFieldConfig {
    fieldPath: TrnFieldPath;
    label: string;
    step: 1 | 2;
}

export const TRN_FIELD_CONFIG: readonly TrnFieldConfig[] = [
    {
        fieldPath: "registrationType",
        label: "Registration Type",
        step: 1,
    },
    {
        fieldPath: "taxpayerType",
        label: "I am a",
        step: 1,
    },
    {
        fieldPath: "state",
        label: "State / UT",
        step: 1,
    },
    {
        fieldPath: "district",
        label: "District",
        step: 1,
    },
    {
        fieldPath: "legalBusinessName",
        label: "Legal Name of the Business (As mentioned in PAN)",
        step: 1,
    },
    {
        fieldPath: "pan",
        label: "Permanent Account Number (PAN)",
        step: 1,
    },
    {
        fieldPath: "email",
        label: "Email Address",
        step: 1,
    },
    {
        fieldPath: "mobile",
        label: "Mobile Number",
        step: 1,
    },
    {
        fieldPath: "captcha",
        label: "Captcha Code",
        step: 1,
    },
    {
        fieldPath: "mobileOtp",
        label: "Mobile OTP",
        step: 2,
    },
    {
        fieldPath: "emailOtp",
        label: "Email OTP",
        step: 2,
    },
] as const;

export interface TrnRegistrationData {
    registrationType: string;
    taxpayerType: string;
    state: string;
    district: string;
    legalBusinessName: string;
    pan: string;
    email: string;
    mobile: string;
    captcha: string;
    mobileOtp: string;
    emailOtp: string;
}

export const EMPTY_TRN_REGISTRATION_DATA: TrnRegistrationData = {
    registrationType: TRN_REGISTRATION_TYPE_OPTIONS[0],
    taxpayerType: "",
    state: "",
    district: "",
    legalBusinessName: "",
    pan: "",
    email: "",
    mobile: "",
    captcha: "",
    mobileOtp: "",
    emailOtp: "",
};

function normalizeLabel(label: string) {
    return label
        .toLowerCase()
        .replace(/\(.*?\)/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

const TRN_FIELD_PATH_BY_LABEL = new Map<string, TrnFieldPath>(
    TRN_FIELD_CONFIG.flatMap((field) => {
        const aliases = [field.label];

        switch (field.fieldPath) {
            case "registrationType":
                aliases.push("New Registration / TRN");
                break;
            case "captcha":
                aliases.push("Type the characters you see in the image below");
                aliases.push("Enter characters as displayed in the CAPTCHA image");
                break;
            case "mobileOtp":
                aliases.push("Mobile OTP (123456)");
                break;
            case "emailOtp":
                aliases.push("Email OTP (123456)");
                break;
            default:
                break;
        }

        return aliases.map((alias) => [normalizeLabel(alias), field.fieldPath] as const);
    }),
);

export function getTrnFieldPathFromLabel(
    label: string | null | undefined,
    index?: number,
): string {
    const normalized = normalizeLabel(label ?? "");
    const matched = TRN_FIELD_PATH_BY_LABEL.get(normalized);

    if (matched) {
        return matched;
    }

    return `gstfField${typeof index === "number" ? index + 1 : ""}`;
}

export function getTrnFieldLabel(fieldPath: TrnFieldPath): string {
    return (
        TRN_FIELD_CONFIG.find((field) => field.fieldPath === fieldPath)?.label ??
        fieldPath
    );
}

export function getDistrictOptions(state: string) {
    return TRN_DISTRICT_OPTIONS_BY_STATE[state] ?? [];
}
