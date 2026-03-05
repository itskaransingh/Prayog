import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const INCOME_TAX_SUBTOPICS: { title: string; taskCount: number; progress: number }[] = [
    { title: "E-PAN", taskCount: 4, progress: 0 },
    { title: "ITR-Registration", taskCount: 6, progress: 24 },
    { title: "ITR Filing - AY 2025-2026", taskCount: 8, progress: 0 },
    { title: "e-Verify Return", taskCount: 3, progress: 67 },
    { title: "Link Aadhaar", taskCount: 2, progress: 100 },
    { title: "Link Aadhaar Status", taskCount: 2, progress: 50 },
    { title: "e-Pay Tax", taskCount: 5, progress: 20 },
    { title: "Know Tax Payment Status", taskCount: 2, progress: 0 },
    { title: "Know TAN Details", taskCount: 3, progress: 33 },
    { title: "Verify PAN Status", taskCount: 2, progress: 0 },
    { title: "Tax Calendar", taskCount: 4, progress: 25 },
    { title: "ITR-1 (Sahaj)", taskCount: 7, progress: 14 },
    { title: "ITR-2", taskCount: 6, progress: 0 },
    { title: "TDS on Cash Withdrawal", taskCount: 3, progress: 0 },
    { title: "Instant E-PAN", taskCount: 2, progress: 0 },
    { title: "Authenticate Notice/Order (ITD)", taskCount: 4, progress: 75 },
    { title: "Comply to Notice", taskCount: 3, progress: 0 },
    { title: "Tax Information & Services", taskCount: 5, progress: 40 },
];

export default function IncomeTaxSubtopicsPage() {
    return (
        <div className="flex flex-1 flex-col gap-6 p-6 w-full max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Income Tax
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Select a subtopic to view learning content and assignments.
                </p>
            </div>

            <div className="flex flex-col gap-3">
                {INCOME_TAX_SUBTOPICS.map((item, index) => {
                    const isItrRegistration = item.title === "ITR-Registration";
                    const href = isItrRegistration ? "/course/income-tax" : "#";
                    return (
                        <Link key={item.title} href={href}>
                            <Card className="group w-full transition-all duration-200 hover:shadow-md border-gray-200 hover:border-blue-200 bg-white cursor-pointer overflow-hidden">
                                <CardContent className="flex flex-row items-center gap-4 py-4 px-5">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-semibold text-sm shadow-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-base font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                                                {item.title}
                                            </span>
                                            <span className="text-sm text-gray-500 shrink-0">
                                                {item.taskCount} task{item.taskCount !== 1 ? "s" : ""}
                                            </span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                                                <span>Progress</span>
                                                <span className={item.progress > 0 ? "text-blue-600" : ""}>
                                                    {item.progress}%
                                                </span>
                                            </div>
                                            <Progress value={item.progress} className="h-2" />
                                        </div>
                                    </div>
                                    <ChevronRight className="size-5 text-gray-400 group-hover:text-blue-600 shrink-0 transition-colors" />
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
