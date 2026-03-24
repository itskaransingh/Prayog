import type { LucideIcon } from "lucide-react";
import {
    BookOpen,
    Briefcase,
    Building,
    Calculator,
    Coins,
    FileText,
    Gavel,
    GraduationCap,
    Landmark,
    PiggyBank,
    Receipt,
    Scale,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
    BookOpen,
    Briefcase,
    Building,
    Calculator,
    Coins,
    FileText,
    Gavel,
    GraduationCap,
    Landmark,
    PiggyBank,
    Receipt,
    Scale,
};

const LEGACY_MODULE_STYLES: Record<
    string,
    {
        bgColor: string;
        iconName: string;
        textColor: string;
    }
> = {
    "Income Tax": {
        iconName: "Calculator",
        bgColor: "bg-blue-50",
        textColor: "text-blue-600",
    },
    GST: {
        iconName: "FileText",
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-600",
    },
    "Labour Laws": {
        iconName: "Briefcase",
        bgColor: "bg-amber-50",
        textColor: "text-amber-600",
    },
    "Company Law": {
        iconName: "Landmark",
        bgColor: "bg-purple-50",
        textColor: "text-purple-600",
    },
    "Audit & Assurance": {
        iconName: "Scale",
        bgColor: "bg-rose-50",
        textColor: "text-rose-600",
    },
    "General Topics": {
        iconName: "BookOpen",
        bgColor: "bg-slate-50",
        textColor: "text-slate-600",
    },
};

const DEFAULT_BG_COLOR = "bg-slate-50";
const DEFAULT_TEXT_COLOR = "text-slate-600";

export function getModulePresentation(
    title: string,
    iconName?: string,
    bgColor?: string,
    textColor?: string
) {
    const legacyStyles = LEGACY_MODULE_STYLES[title];
    return {
        Icon: ICON_MAP[iconName || legacyStyles?.iconName || ""] ?? BookOpen,
        bgColor: bgColor || legacyStyles?.bgColor || DEFAULT_BG_COLOR,
        textColor: textColor || legacyStyles?.textColor || DEFAULT_TEXT_COLOR,
    };
}

export function getSubmoduleHref(moduleSlug: string, submoduleSlug: string) {
    if (!moduleSlug || !submoduleSlug) {
        return "#";
    }

    return `/course/${submoduleSlug}`;
}
