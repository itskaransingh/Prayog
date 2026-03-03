import { evaluateRegistration } from "../lib/evaluation";
import { GROUND_TRUTH } from "../lib/simulation/constants";

const mockData = {
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
};

const startTime = Date.now() - 120000; // 2 minutes ago
const endTime = Date.now();

console.log("Testing evaluation with perfect match...");
const perfectResult = evaluateRegistration(mockData, startTime, endTime);
console.log(`Accuracy: ${perfectResult.accuracy}%`);
console.log(`Score: ${perfectResult.totalScore} / ${perfectResult.maxPossibleScore}`);
if (perfectResult.accuracy !== 100) {
    console.error("FAILED: Expected 100% accuracy");
    process.exit(1);
}

console.log("\nTesting evaluation with partial match...");
const partialData = {
    ...mockData,
    personalDetails: {
        ...mockData.personalDetails,
        firstName: "Rajes", // Partial match
    }
};

const partialResult = evaluateRegistration(partialData, startTime, endTime);
console.log(`Accuracy: ${partialResult.accuracy}%`);
console.log(`Score: ${partialResult.totalScore} / ${partialResult.maxPossibleScore}`);
if (partialResult.accuracy >= 100) {
    console.error("FAILED: Expected less than 100% accuracy");
    process.exit(1);
}

console.log("\nVerification Successful!");
