import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LmsBreadcrumbs } from "@/components/lms/lms-breadcrumbs";
import { BookOpen, ClipboardList } from "lucide-react";
import Link from "next/link";

export default function OfferingsPage() {
    return (
        <div className="flex flex-1  container mx-auto flex-col gap-6 p-6">
            <LmsBreadcrumbs items={[{ label: "Prayog Offerings" }]} />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Prayog Offerings
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Select an option below to proceed.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-4xl">
                {/* Learning Contents Card */}
                <Link href="/learning-contents">
                    <Card className="group h-full transition-all duration-300 hover:shadow-md border-border hover:-translate-y-1 bg-card overflow-hidden cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-muted/30 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="flex size-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                    <BookOpen className="size-6" />
                                </div>
                                <CardTitle className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                    Learning Contents
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 pb-6">
                            <div className="space-y-4">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Access course materials, lectures, and resources for your enrolled subjects.
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm font-bold">
                                        <span className="text-foreground/80">Overall Progress</span>
                                        <span className="text-primary font-bold">1.6% Completed</span>
                                    </div>
                                    <Progress value={1.6} className="h-2 w-full" />
                                </div>
                                <div className="mt-6 flex items-center text-sm font-bold text-primary group-hover:underline">
                                    View Contents
                                    <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* Assignment Card */}
                <Link href="#">
                    <Card className="group h-full transition-all duration-300 hover:shadow-md border-border hover:-translate-y-1 bg-card overflow-hidden cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-muted/30 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="flex size-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                                    <ClipboardList className="size-6" />
                                </div>
                                <CardTitle className="text-xl font-bold tracking-tight text-foreground group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                                    Assignment
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 pb-6">
                            <div className="space-y-4">
                                <p className="text-sm font-medium text-muted-foreground">
                                    View and submit your assignments, tasks, and practical exercises.
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm font-bold">
                                        <span className="text-foreground/80">Time Progress</span>
                                        <span className="text-purple-600 dark:text-purple-400 font-bold">0m / 255h 40m</span>
                                    </div>
                                    <Progress value={0} className="h-2 w-full" />
                                </div>
                                <div className="mt-6 flex items-center text-sm font-bold text-purple-600 dark:text-purple-400 group-hover:underline">
                                    View Assignments
                                    <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
