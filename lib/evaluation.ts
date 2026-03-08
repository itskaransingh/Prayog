import { RegistrationData } from "./simulation/registration-context";
import { GROUND_TRUTH } from "./simulation/constants";

export interface FieldResult {
    field: string;
    entered: string;
    expected: string;
    score: number; // 0, 0.5, or 1
    status: "correct" | "partial" | "incorrect";
}

export interface EvaluationResult {
    accuracy: number;
    totalScore: number;
    maxPossibleScore: number;
    fieldBreakdown: FieldResult[];
    timeTakenSeconds: number;
}

/**
 * Normalizes strings for comparison (lowercase, trimmed)
 */
function normalize(str: string): string {
    return (str || "").trim().toLowerCase();
}

/**
 * Scores a single field comparison
 */
function scoreField(entered: string, expected: string): { score: number; status: FieldResult["status"] } {
    const e = normalize(entered);
    const x = normalize(expected);

    if (e === x) {
        return { score: 1, status: "correct" };
    }

    if (x.includes(e) && e.length > 0 && e.length >= x.length / 2) {
        return { score: 0.5, status: "partial" };
    }

    return { score: 0, status: "incorrect" };
}

/**
 * Evaluates the complete registration data against ground truth
 */
export function evaluateRegistration(
    data: RegistrationData,
    startTime: number,
    endTime: number
): EvaluationResult {
    const breakdown: FieldResult[] = [];

    // Fields to evaluate
    const fieldMap: { [key: string]: { entered: string; expected: string } } = {
        "Register As": { entered: data.registerAs, expected: GROUND_TRUTH.registerAs },
        "PAN": { entered: data.pan, expected: GROUND_TRUTH.pan },
        "First Name": { entered: data.personalDetails.firstName, expected: GROUND_TRUTH.personalDetails.firstName },
        "Middle Name": { entered: data.personalDetails.middleName, expected: GROUND_TRUTH.personalDetails.middleName },
        "Last Name": { entered: data.personalDetails.lastName, expected: GROUND_TRUTH.personalDetails.lastName },
        "Date of Birth": { entered: data.personalDetails.dob, expected: GROUND_TRUTH.personalDetails.dob },
        "Gender": { entered: data.personalDetails.gender, expected: GROUND_TRUTH.personalDetails.gender },
        "Flat/Door": { entered: data.addressDetails.flatDoorNo, expected: GROUND_TRUTH.addressDetails.flatDoorNo },
        "Road/Street": { entered: data.addressDetails.road, expected: GROUND_TRUTH.addressDetails.road },
        "Area/Locality": { entered: data.addressDetails.area, expected: GROUND_TRUTH.addressDetails.area },
        "City/Town": { entered: data.addressDetails.city, expected: GROUND_TRUTH.addressDetails.city },
        "State": { entered: data.addressDetails.state, expected: GROUND_TRUTH.addressDetails.state },
        "Pincode": { entered: data.addressDetails.pincode, expected: GROUND_TRUTH.addressDetails.pincode },
        "Mobile Number": { entered: data.contactDetails.mobile, expected: GROUND_TRUTH.contactDetails.mobile },
        "Email ID": { entered: data.contactDetails.email, expected: GROUND_TRUTH.contactDetails.email },
        "Alt. Contact": { entered: data.contactDetails.alternateContact, expected: GROUND_TRUTH.contactDetails.alternateContact },
    };

    let totalScore = 0;
    // maxPossibleScore computed from remaining fields
    const maxPossibleScore = Object.keys(fieldMap).length;

    for (const [label, { entered, expected }] of Object.entries(fieldMap)) {
        const { score, status } = scoreField(entered, expected);
        totalScore += score;
        breakdown.push({
            field: label,
            entered: entered || "(empty)",
            expected,
            score,
            status,
        });
    }

    const accuracy = Math.round((totalScore / maxPossibleScore) * 100);
    const timeTakenSeconds = Math.round((endTime - startTime) / 1000);

    return {
        accuracy,
        totalScore,
        maxPossibleScore,
        fieldBreakdown: breakdown,
        timeTakenSeconds,
    };
}
