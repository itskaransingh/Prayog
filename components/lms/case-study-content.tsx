"use client";

import type { QuestionTableData, QuestionWithEvaluation } from "@/lib/supabase/questions";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const EVALUATION_STORAGE_KEY = "itr-registration-evaluation-mappings";

interface CaseStudyContentProps {
    title: string;
    breadcrumb: string;
    questions: QuestionWithEvaluation[];
    submoduleSlug: string;
}

function QuestionTable({ tableData }: { tableData: QuestionTableData }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
                {tableData.headers.length > 0 && (
                    <thead>
                        <tr>
                            {tableData.headers.map((header) => (
                                <th
                                    key={header}
                                    className="border border-gray-300 bg-gray-50 px-4 py-2 text-left text-sm font-semibold"
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
                                    ? "border border-gray-300 bg-gray-50 px-4 py-2 font-medium"
                                    : "border border-gray-300 px-4 py-2";

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
}: CaseStudyContentProps) {
    const evaluationMappings = questions.flatMap(
        (question) => question.evaluation_criteria[0]?.evaluation_data.mappings ?? []
    );
    const hasQuestions = questions.length > 0;

    return (
        <div className="flex container mx-auto flex-1 flex-col gap-6 p-6 pb-24">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    {breadcrumb}
                </p>
            </div>

            <Separator />

            {hasQuestions ? (
                questions.map((question) => (
                    <div key={question.id} id={`question-${question.id}`} className="flex flex-col gap-6 scroll-mt-20">
                        <Card className="border-blue-200 bg-blue-50/30">
                            <CardContent className="pt-6">
                                <p className="text-lg leading-relaxed text-blue-900">
                                    {question.paragraph}
                                </p>
                            </CardContent>
                        </Card>

                        {question.has_table && question.table_data && (
                            <Card>
                                <CardContent className="pt-6">
                                    <QuestionTable tableData={question.table_data} />
                                </CardContent>
                            </Card>
                        )}

                        {question.has_image && question.image_url && (
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={question.image_url}
                                            alt={question.title}
                                            className="h-auto w-full object-contain"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                ))
            ) : (
                <Card className="border-dashed">
                    <CardContent className="pt-6 text-sm text-muted-foreground">
                        No case study content is available for this submodule yet.
                    </CardContent>
                </Card>
            )}

            <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/80 p-4 backdrop-blur-md ">
                <div className="flex container mx-auto items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-900">Ready to begin?</p>
                        <p className="text-xs text-muted-foreground">This task will take approximately 15-20 minutes.</p>
                    </div>
                    <Button
                        size="lg"
                        className="gap-2 px-8 font-bold"
                        disabled={!hasQuestions || evaluationMappings.length === 0}
                        onClick={() => {
                            if (typeof window === "undefined") return;
                            try {
                                window.localStorage.setItem(
                                    "itr-registration-started",
                                    "true",
                                );
                                window.localStorage.setItem(
                                    EVALUATION_STORAGE_KEY,
                                    JSON.stringify({
                                        submoduleSlug,
                                        mappings: evaluationMappings,
                                    }),
                                );
                            } catch {
                                // ignore storage errors
                            }
                            window.open(
                                "/simulation/gateway",
                                "_blank",
                                "noopener,noreferrer",
                            );
                        }}
                    >
                        Start Task <ArrowRight className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
