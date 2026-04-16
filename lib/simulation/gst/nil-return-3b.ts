export const NIL_RETURN_3B_SUBMODULE_ID = "0134d8e9-2892-4e65-b5b0-1ae876897230";

export const NIL_RETURN_FINANCIAL_YEARS = [
    "2019-2020",
    "2020-2021",
    "2021-2022",
    "2022-2023",
    "2023-2024",
    "2024-2025",
    "2025-2026",
    "2026-2027",
] as const;

export const NIL_RETURN_QUARTERS = [
    "Quarter 1 (Apr-Jun)",
    "Quarter 2 (Jul-Sep)",
    "Quarter 3 (Oct-Dec)",
    "Quarter 4 (Jan-Mar)",
] as const;

export const NIL_RETURN_PERIODS_BY_QUARTER: Record<string, readonly string[]> = {
    "Quarter 1 (Apr-Jun)": ["April", "May", "June"],
    "Quarter 2 (Jul-Sep)": ["July", "August", "September"],
    "Quarter 3 (Oct-Dec)": ["October", "November", "December"],
    "Quarter 4 (Jan-Mar)": ["January", "February", "March"],
};

export type NilReturn3bFieldPath =
    | "username"
    | "password"
    | "financialYear"
    | "quarter"
    | "period";

export interface NilReturn3bData {
    username: string;
    password: string;
    financialYear: string;
    quarter: string;
    period: string;
}

export const EMPTY_NIL_RETURN_3B_DATA: NilReturn3bData = {
    username: "",
    password: "",
    financialYear: "",
    quarter: "",
    period: "",
};

function normalizeLabel(label: string): string {
    return label
        .toLowerCase()
        .replace(/\(.*?\)/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

const NIL_FIELD_PATH_BY_LABEL = new Map<string, NilReturn3bFieldPath>([
    ["username", "username"],
    ["user id", "username"],
    ["password", "password"],
    ["financial year", "financialYear"],
    ["quarter", "quarter"],
    ["period", "period"],
]);

export function getNilReturn3bFieldPathFromLabel(
    label: string | null | undefined,
    index?: number,
): string {
    const normalized = normalizeLabel(label ?? "");
    const matched = NIL_FIELD_PATH_BY_LABEL.get(normalized);
    if (matched) return matched;
    return `nilField${typeof index === "number" ? index + 1 : ""}`;
}
