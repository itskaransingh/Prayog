"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calculator, Landmark, ShieldCheck, GraduationCap } from "lucide-react";
import Link from "next/link";

const TOPICS = [
    {
        title: "Income Tax",
        progress: 38,
        courses: 5,
        tasks: 12,
        icon: Calculator,
        href: "/learning-contents/income-tax",
        active: true,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-100",
    },
    {
        title: "Goods and Service Tax",
        progress: 15,
        courses: 8,
        tasks: 24,
        icon: Landmark,
        href: "#",
        active: false,
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-100",
    },
    {
        title: "Labour Laws",
        progress: 5,
        courses: 4,
        tasks: 10,
        icon: ShieldCheck,
        href: "#",
        active: false,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-100",
    },
    {
        title: "Corporate Law",
        progress: 0,
        courses: 6,
        tasks: 18,
        icon: GraduationCap,
        href: "#",
        active: false,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-100",
    },
    {
        title: "Financial Accounting",
        progress: 22,
        courses: 10,
        tasks: 30,
        icon: BookOpen,
        href: "#",
        active: false,
        color: "text-rose-600",
        bgColor: "bg-rose-50",
        borderColor: "border-rose-100",
    },
];

export function DashboardGrid() {
    return (
        <div className="flex flex-1 flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Learning Contents
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Access your courses and track your progress across different tax domains.
                    </p>
                </div>
                <Badge variant="outline" className="px-3 py-1 font-medium">
                    AY 2025-26
                </Badge>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {TOPICS.map((topic) => (
                    <Link
                        key={topic.title}
                        href={topic.href}
                        className={!topic.active ? "cursor-not-allowed" : ""}
                        onClick={(e) => !topic.active && e.preventDefault()}
                    >
                        <Card className={`group h-full transition-all duration-300 hover:shadow-lg ${topic.borderColor} ${topic.active ? "hover:-translate-y-1" : "opacity-70"}`}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className={`flex size-12 items-center justify-center rounded-xl ${topic.bgColor} ${topic.color}`}>
                                    <topic.icon className="size-6" />
                                </div>
                                {topic.active && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                                        In Progress
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent className="pt-4">
                                <CardTitle className="text-xl font-bold tracking-tight mb-4">
                                    {topic.title}
                                </CardTitle>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground font-medium">Progress</span>
                                        <span className="font-bold text-gray-900">{topic.progress}%</span>
                                    </div>
                                    <Progress value={topic.progress} className="h-2" />

                                    <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground pt-2">
                                        <span className="flex items-center gap-1">
                                            {topic.courses} Courses
                                        </span>
                                        <span className="size-1 rounded-full bg-gray-300" />
                                        <span className="flex items-center gap-1">
                                            {topic.tasks} Tasks
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
