"use client";

import { useSearchParams } from "next/navigation";

import type { QuestionTableData, Question } from "@/lib/supabase/questions";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSubmoduleHref } from "@/lib/learning-contents";

interface CaseStudyContentProps {
    title: string;
    breadcrumb: string;
    questions: Question[];
    submoduleSlug: string;
    prevSubmodule?: { title: string; slug: string } | null;
    nextSubmodule?: { title: string; slug: string } | null;
    moduleSlug?: string;
}

function YoutubeEmbed({ url }: { url: string }) {
    // Extract video ID from youtube URL
    let videoId = "";
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === "youtu.be") {
            videoId = urlObj.pathname.slice(1);
        } else {
            videoId = urlObj.searchParams.get("v") || "";
        }
    } catch (e) {
        // Fallback or invalid URL handling
        console.error("Invalid YouTube URL", e);
    }

    if (!videoId) return null;

    return (
        <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-black shadow-lg">
            <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
            ></iframe>
        </div>
    );
}

function GDriveLink({ url, title }: { url: string; title?: string | null }) {
    return (
        <Card className="group relative overflow-hidden border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-900/10 transition-all duration-300">
            <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <ExternalLink className="size-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 line-clamp-1">
                            {title || "Attached Document"}
                        </h3>
                        <p className="text-sm text-emerald-700/70 dark:text-emerald-400/70">
                            Click to view resource in a new tab
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="border-emerald-200 bg-white hover:bg-emerald-100 hover:text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950"
                    asChild
                >
                    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        View Resource <ExternalLink className="size-4" />
                    </a>
                </Button>
            </CardContent>
        </Card>
    );
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

                    {activeQuestion.video_url && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground ml-1">
                                <Play className="size-4" />
                                <span>Video Content</span>
                            </div>
                            <YoutubeEmbed url={activeQuestion.video_url} />
                        </div>
                    )}

                    {activeQuestion.link_url && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground ml-1">
                                <ExternalLink className="size-4" />
                                <span>Attached Resources</span>
                            </div>
                            <GDriveLink url={activeQuestion.link_url} title={activeQuestion.link_title} />
                        </div>
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
                        {activeQuestion && !(activeQuestion.video_url || activeQuestion.link_url) && (
                            <Button
                                size="lg"
                                className="gap-2 px-10 font-bold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground"
                                disabled={!hasQuestions}
                                onClick={() => {
                                    if (typeof window === "undefined") return;
                                    const isEPANSubmodule = submoduleSlug === "e-pan-registration";
                                    try {
                                        window.localStorage.setItem(
                                            isEPANSubmodule
                                                ? "epan-registration-started"
                                                : "itr-registration-started",
                                            "true",
                                        );
                                    } catch {
                                        // ignore storage errors
                                    }
                                    const gatewayPath = "/simulation/gateway";
                                        
                                    window.open(
                                        activeQuestion ? `${gatewayPath}?questionId=${activeQuestion.id}` : gatewayPath,
                                        "_blank",
                                        "noopener,noreferrer",
                                    );
                                }}
                            >
                                Start Task <ArrowRight className="size-4" />
                            </Button>
                        )}
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
