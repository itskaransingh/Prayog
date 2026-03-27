"use client";

import { useSearchParams } from "next/navigation";

import type { QuestionTableData, Question } from "@/lib/supabase/questions";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSubmoduleHref } from "@/lib/learning-contents";

const EVALUATION_STORAGE_KEY = "itr-registration-evaluation-mappings";

interface CaseStudyContentProps {
    title: string;
    breadcrumb: string;
    questions: Question[];
    submoduleSlug: string;
    prevSubmodule?: { title: string; slug: string } | null;
    nextSubmodule?: { title: string; slug: string } | null;
    moduleSlug?: string;
}

function QuestionTable({ tableData }: { tableData: QuestionTableData }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
                {tableData.headers.length > 0 && (
                    <thead>
                        <tr>
                            {tableData.headers.map((header) => (
                                <th
                                    key={header}
                                    className="border border-border bg-muted/50 px-4 py-2 text-left text-sm font-semibold text-foreground"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                )}
                <tbody>
                    {tableData.rows.map((row, rowIndex) => (
                        <tr key={`${rowIndex}-${row.join("-")}`}>
                            {row.map((cell, cellIndex) => {
                                const isTwoColumnLayout =
                                    tableData.headers.length === 0 && row.length === 2;
                                const cellClassName = isTwoColumnLayout && cellIndex === 0
                                    ? "border border-border bg-muted/50 px-4 py-2 font-medium text-foreground"
                                    : "border border-border px-4 py-2 text-foreground";

                                return (
                                    <td key={`${rowIndex}-${cellIndex}`} className={cellClassName}>
                                        {cell}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function CaseStudyContent({
    title,
    breadcrumb,
    questions,
    submoduleSlug,
    prevSubmodule,
    nextSubmodule,
    moduleSlug,
}: CaseStudyContentProps) {
    const searchParams = useSearchParams();
    const qid = searchParams.get("qid");

    const activeQuestion = qid
        ? questions.find((q) => q.id === qid)
        : questions.length > 0
        ? questions[0]
        : null;

    const hasQuestions = questions.length > 0;

    return (
        <div className="flex container mx-auto flex-1 flex-col gap-6 p-6 pb-32">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    {breadcrumb}
                </p>
            </div>

            <Separator className="bg-border" />

            {hasQuestions && activeQuestion ? (
                <div key={activeQuestion.id} id={`question-${activeQuestion.id}`} className="flex flex-col gap-6">
                    <Card className="border-blue-200 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-900/10">
                        <CardContent className="pt-6">
                            <p className="text-lg leading-relaxed text-blue-900 dark:text-blue-200">
                                {activeQuestion.paragraph}
                            </p>
                        </CardContent>
                    </Card>

                    {activeQuestion.has_table && activeQuestion.table_data && (
                        <Card className="border-border bg-card">
                            <CardContent className="pt-6">
                                <QuestionTable tableData={activeQuestion.table_data} />
                            </CardContent>
                        </Card>
                    )}

                    {activeQuestion.has_image && activeQuestion.image_url && (
                        <Card className="border-border bg-card">
                            <CardContent className="pt-6">
                                <div className="overflow-hidden rounded-lg border border-border bg-background">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={activeQuestion.image_url}
                                        alt={activeQuestion.title}
                                        className="h-auto w-full object-contain"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            ) : (
                <Card className="border-dashed border-border bg-muted/20">
                    <CardContent className="pt-6 text-sm text-muted-foreground text-center">
                        No case study content is available for this submodule yet.
                    </CardContent>
                </Card>
            )}

            <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 p-4 backdrop-blur-md shadow-2xl">
                <div className="flex container mx-auto items-center justify-between gap-4">
                    <div className="flex flex-1 items-center justify-start">
                        {prevSubmodule && moduleSlug && (
                            <Link href={getSubmoduleHref(moduleSlug, prevSubmodule.slug)} className="max-w-[150px] sm:max-w-[200px]">
                                <Button variant="outline" size="sm" className="w-full flex gap-2 justify-start border-muted-foreground/20 hover:border-primary/50 text-foreground">
                                    <ChevronLeft className="size-4 shrink-0" />
                                    <span className="truncate">{prevSubmodule.title}</span>
                                </Button>
                            </Link>
                        )}
                    </div>

                    <div className="flex flex-[2] items-center justify-center gap-4">
                        <div className="hidden lg:block text-right mr-4">
                            <p className="text-sm font-bold text-foreground">Ready to begin?</p>
                            <p className="text-xs text-muted-foreground">Approx. 15-20 mins</p>
                        </div>
                        <Button
                            size="lg"
                            className="gap-2 px-10 font-bold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground"
                            disabled={!hasQuestions}
                            onClick={() => {
                                if (typeof window === "undefined") return;
                                try {
                                    window.localStorage.setItem(
                                        "itr-registration-started",
                                        "true",
                                    );
                                } catch {
                                    // ignore storage errors
                                }
                                const gatewayPath = submoduleSlug === "epan-registration" 
                                    ? "/epan-simulation/gateway" 
                                    : "/simulation/gateway";
                                    
                                window.open(
                                    activeQuestion ? `${gatewayPath}?questionId=${activeQuestion.id}` : gatewayPath,
                                    "_blank",
                                    "noopener,noreferrer",
                                );
                            }}
                        >
                            Start Task <ArrowRight className="size-4" />
                        </Button>
                    </div>

                    <div className="flex flex-1 items-center justify-end">
                        {nextSubmodule && moduleSlug && (
                            <Link href={getSubmoduleHref(moduleSlug, nextSubmodule.slug)} className="max-w-[150px] sm:max-w-[200px]">
                                <Button variant="outline" size="sm" className="w-full flex gap-2 justify-end border-muted-foreground/20 hover:border-primary/50 text-foreground">
                                    <span className="truncate">{nextSubmodule.title}</span>
                                    <ChevronRight className="size-4 shrink-0" />
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
