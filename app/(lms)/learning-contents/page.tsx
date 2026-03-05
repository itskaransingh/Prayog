import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    BookOpen,
    Scale,
    Briefcase,
    FileText,
    Landmark,
    Calculator,
} from "lucide-react";
import Link from "next/link";

const LEARNING_CONTENTS = [
    {
        title: "Income Tax",
        courseCount: 12,
        progress: 24,
        href: "/learning-contents/income-tax",
        icon: Calculator,
        bgColor: "bg-blue-50",
        color: "text-blue-600",
    },
    {
        title: "GST",
        courseCount: 8,
        progress: 0,
        href: "#",
        icon: FileText,
        bgColor: "bg-emerald-50",
        color: "text-emerald-600",
    },
    {
        title: "Labour Laws",
        courseCount: 6,
        progress: 67,
        href: "#",
        icon: Briefcase,
        bgColor: "bg-amber-50",
        color: "text-amber-600",
    },
    {
        title: "Company Law",
        courseCount: 5,
        progress: 12,
        href: "#",
        icon: Landmark,
        bgColor: "bg-purple-50",
        color: "text-purple-600",
    },
    {
        title: "Audit & Assurance",
        courseCount: 4,
        progress: 0,
        href: "#",
        icon: Scale,
        bgColor: "bg-rose-50",
        color: "text-rose-600",
    },
    {
        title: "General Topics",
        courseCount: 10,
        progress: 45,
        href: "#",
        icon: BookOpen,
        bgColor: "bg-slate-50",
        color: "text-slate-600",
    },
];

export default function LearningContentsPage() {
    return (
        <div className="flex flex-1 flex-col gap-6 p-6 w-full max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Learning Contents
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Browse courses by subject. Track your progress for each area.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {LEARNING_CONTENTS.map((item) => (
                    <Link key={item.title} href={item.href}>
                        <Card className="group h-full transition-all duration-300 hover:shadow-md border-gray-200 hover:-translate-y-1 bg-white overflow-hidden cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gray-50/50 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`flex size-11 items-center justify-center rounded-lg ${item.bgColor} ${item.color}`}
                                    >
                                        <item.icon className="size-5" />
                                    </div>
                                    <CardTitle className="text-lg font-bold tracking-tight text-gray-900 group-hover:text-blue-700 transition-colors">
                                        {item.title}
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-5 pb-5">
                                <div className="space-y-4">
                                    <p className="text-sm font-medium text-gray-500">
                                        {item.courseCount} course{item.courseCount !== 1 ? "s" : ""}
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm font-medium">
                                            <span className="text-gray-700">Progress</span>
                                            <span className={item.progress > 0 ? "text-blue-600" : "text-gray-500"}>
                                                {item.progress}%
                                            </span>
                                        </div>
                                        <Progress value={item.progress} className="h-2 w-full" />
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
