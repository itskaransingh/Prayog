"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, GraduationCap, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const PROGRAMS = [
    {
        title: "Prayog Offerings (New)",
        subtitle: "Explore new courses",
        provider: "Prayog",
        icon: Sparkles,
        href: "/offerings",
        active: true,
        logo: "prayog",
        color: "text-purple-600",
        bgColor: "bg-purple-50",
    },
    {
        title: "Semester 1 & 2 (Open Elective)",
        subtitle: "Xavier's College",
        provider: "Prayog",
        icon: BookOpen,
        href: "/course/income-tax",
        active: true,
        logo: "xavier",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
    },
    {
        title: "Semester 2 (B.Com)",
        subtitle: "Xavier's College",
        provider: "Prayog",
        icon: GraduationCap,
        href: "/course/income-tax",
        active: true,
        logo: "xavier",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
    }
];

export function ProgramsDashboard() {
    return (
        <div className="flex flex-1 flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Our Programs
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Access your enrolled programs and explore new offerings.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {PROGRAMS.map((program) => (
                    <Link
                        key={program.title}
                        href={program.href}
                        className={!program.active ? "cursor-not-allowed" : ""}
                        onClick={(e) => !program.active && e.preventDefault()}
                    >
                        <Card className="group h-full transition-all duration-300 hover:shadow-md border-gray-200 hover:-translate-y-1 bg-white overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gray-50/50 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className={`flex size-10 items-center justify-center rounded-lg ${program.bgColor} ${program.color}`}>
                                        <program.icon className="size-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            {program.provider}
                                        </span>
                                    </div>
                                </div>
                                {program.logo === "xavier" ? (
                                    <div className="h-10 w-8 bg-white flex flex-col items-center justify-center rounded shadow-sm border border-gray-200 overflow-hidden relative">
                                        <Image src="/xavier-logo.png" alt="Xavier Logo" fill className="object-contain p-0.5" />
                                    </div>
                                ) : (
                                    <div className="h-8 w-8 bg-blue-600 text-white flex items-center justify-center rounded text-xs font-bold font-sans shadow-sm">
                                        P
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="pt-6 pb-6">
                                <h3 className="text-xl font-bold tracking-tight text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">
                                    {program.title}
                                </h3>
                                <p className="text-sm font-medium text-gray-500">
                                    {program.subtitle}
                                </p>

                                <div className="mt-6 flex items-center text-sm font-medium text-blue-600 group-hover:underline">
                                    View Program Details
                                    <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
