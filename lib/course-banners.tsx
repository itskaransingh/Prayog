import type { JSX } from "react";

export interface CourseBanner {
    gradient: string;
    decoration: JSX.Element;
    starfieldDots: string;
}

export const COURSE_BANNERS: Record<string, CourseBanner> = {
    "Income Tax": {
        gradient: "from-purple-900 via-purple-800 to-indigo-900",
        starfieldDots: `radial-gradient(1.5px 1.5px at 20% 30%, white 0%, transparent 100%),
            radial-gradient(1px 1px at 60% 20%, white 0%, transparent 100%),
            radial-gradient(1px 1px at 80% 60%, white 0%, transparent 100%)`,
        decoration: (
            <>
                <div className="absolute top-4 right-8 w-20 h-20 rounded-full bg-purple-500/20 blur-xl" />
                <div className="absolute bottom-8 left-12 w-16 h-16 rounded-full bg-indigo-500/20 blur-lg" />
                <svg className="absolute bottom-0 right-0 w-32 h-32 opacity-20" viewBox="0 0 100 100">
                    <polygon points="50,10 90,90 10,90" fill="white" />
                </svg>
            </>
        ),
    },
    "Goods and Service Tax": {
        gradient: "from-blue-900 via-blue-800 to-cyan-900",
        starfieldDots: `radial-gradient(1.5px 1.5px at 25% 35%, white 0%, transparent 100%),
            radial-gradient(1px 1px at 55% 15%, white 0%, transparent 100%),
            radial-gradient(1px 1px at 75% 55%, white 0%, transparent 100%)`,
        decoration: (
            <>
                <div className="absolute top-6 right-12 w-24 h-24 rounded-full bg-blue-500/20 blur-xl" />
                <div className="absolute bottom-10 left-8 w-12 h-12 rounded-full bg-cyan-500/20 blur-lg" />
                <svg className="absolute bottom-0 left-0 w-28 h-28 opacity-15" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="2" />
                    <circle cx="50" cy="50" r="25" fill="none" stroke="white" strokeWidth="1" />
                </svg>
            </>
        ),
    },
    "Financial Accounting": {
        gradient: "from-emerald-900 via-emerald-800 to-teal-900",
        starfieldDots: `radial-gradient(1.5px 1.5px at 30% 25%, white 0%, transparent 100%),
            radial-gradient(1px 1px at 65% 40%, white 0%, transparent 100%),
            radial-gradient(1px 1px at 85% 20%, white 0%, transparent 100%)`,
        decoration: (
            <>
                <div className="absolute top-8 right-16 w-20 h-20 rounded-full bg-emerald-500/20 blur-xl" />
                <div className="absolute bottom-6 left-16 w-14 h-14 rounded-full bg-teal-500/20 blur-lg" />
                <svg className="absolute top-4 left-4 w-24 h-24 opacity-15" viewBox="0 0 100 100">
                    <rect x="20" y="20" width="60" height="60" fill="none" stroke="white" strokeWidth="2" transform="rotate(45 50 50)" />
                </svg>
            </>
        ),
    },
    "Corporate Regulations & MSME": {
        gradient: "from-amber-900 via-amber-800 to-orange-900",
        starfieldDots: `radial-gradient(1.5px 1.5px at 18% 28%, white 0%, transparent 100%),
            radial-gradient(1px 1px at 50% 45%, white 0%, transparent 100%),
            radial-gradient(1px 1px at 78% 22%, white 0%, transparent 100%)`,
        decoration: (
            <>
                <div className="absolute top-6 right-10 w-20 h-20 rounded-full bg-amber-500/20 blur-xl" />
                <div className="absolute bottom-8 left-14 w-14 h-14 rounded-full bg-orange-500/20 blur-lg" />
                <svg className="absolute bottom-2 right-6 w-28 h-28 opacity-15" viewBox="0 0 100 100">
                    <path d="M50 8 L85 25 L85 65 L50 92 L15 65 L15 25 Z" fill="none" stroke="white" strokeWidth="2" />
                    <rect x="40" y="40" width="20" height="25" rx="2" fill="none" stroke="white" strokeWidth="1.5" />
                    <line x1="50" y1="40" x2="50" y2="65" stroke="white" strokeWidth="1" />
                </svg>
            </>
        ),
    },
    "Cost accounting": {
        gradient: "from-violet-900 via-violet-800 to-fuchsia-900",
        starfieldDots: `radial-gradient(1.5px 1.5px at 22% 32%, white 0%, transparent 100%),
            radial-gradient(1px 1px at 58% 18%, white 0%, transparent 100%),
            radial-gradient(1px 1px at 82% 50%, white 0%, transparent 100%)`,
        decoration: (
            <>
                <div className="absolute top-5 right-14 w-22 h-22 rounded-full bg-violet-500/20 blur-xl" />
                <div className="absolute bottom-7 left-10 w-16 h-16 rounded-full bg-fuchsia-500/20 blur-lg" />
                <svg className="absolute bottom-4 right-8 w-28 h-28 opacity-15" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="35" fill="none" stroke="white" strokeWidth="1.5" />
                    <path d="M50 15 L50 50 L75 65" fill="none" stroke="white" strokeWidth="2" />
                    <path d="M50 50 L25 35" fill="none" stroke="white" strokeWidth="1.5" />
                    <path d="M50 50 L65 80" fill="none" stroke="white" strokeWidth="1" />
                </svg>
            </>
        ),
    },
};

export const DEFAULT_BANNER: CourseBanner = {
    gradient: "from-slate-800 via-slate-700 to-slate-900",
    starfieldDots: `radial-gradient(1.5px 1.5px at 20% 30%, white 0%, transparent 100%),
        radial-gradient(1px 1px at 60% 20%, white 0%, transparent 100%),
        radial-gradient(1px 1px at 80% 60%, white 0%, transparent 100%)`,
    decoration: (
        <>
            <div className="absolute top-6 right-12 w-20 h-20 rounded-full bg-slate-500/20 blur-xl" />
            <div className="absolute bottom-8 left-12 w-14 h-14 rounded-full bg-slate-400/20 blur-lg" />
        </>
    ),
};

export function getCourseBanner(title: string): CourseBanner {
    return COURSE_BANNERS[title] ?? DEFAULT_BANNER;
}
