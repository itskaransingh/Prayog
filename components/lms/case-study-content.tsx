"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import type { QuestionTableData, Question } from "@/lib/supabase/questions";
import {
    getQuestionTypeLabel,
    isTaskQuestionType,
} from "@/lib/questions/types";
import { sanitizeRichTextHtml } from "@/lib/questions/rich-text";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LmsBreadcrumbs } from "@/components/lms/lms-breadcrumbs";
import {
    COURSE_STATUS_CHANGE_EVENT,
    COURSE_TOPIC_CHANGE_EVENT,
    dispatchCourseStatusChange,
    dispatchCourseTopicChange,
    type CourseTopicChangeDetail,
} from "@/lib/lms/task-navigation";
import { getSimulationLaunchConfig } from "@/lib/simulation/launch-config";

interface CaseStudyContentProps {
    title: string;
    breadcrumbs: { label: string; href?: string }[];
    questions: Question[];
    submoduleSlug: string;
    moduleSlug?: string;
    simulatorType?:
        | "itr_registration"
        | "epan_registration"
        | "classification"
        | "journal_entry"
        | "ledger"
        | "trial_balance"
        | "financial_statement"
        | "none"
        | null;
}

interface QuestionStatusRecord {
    attempted: boolean;
    completed: boolean;
    taskNumber: number | null;
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

function RichQuestionContent({ html, variant }: { html: string; variant?: "task" | "resource" }) {
    return (
        <div
            className={
                variant === "task"
                    ? "rich-text-content rich-text-content--task"
                    : "rich-text-content"
            }
            dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(html) }}
        />
    );
}

function getQuestionContentHtml(question: Question) {
    if (question.content_html?.trim()) {
        return question.content_html;
    }

    if (question.paragraph?.trim()) {
        return question.paragraph;
    }

    if (question.resource_description?.trim()) {
        return question.resource_description;
    }

    return "";
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
    breadcrumbs,
    questions,
    submoduleSlug,
    moduleSlug,
    simulatorType,
}: CaseStudyContentProps) {
    const searchParams = useSearchParams();
    const qid = searchParams.get("qid");
    const [activeQid, setActiveQid] = React.useState<string | null>(qid);

    React.useEffect(() => {
        setActiveQid(qid);
    }, [qid]);

    React.useEffect(() => {
        const handlePopState = () => {
            const params = new URL(window.location.href).searchParams;
            setActiveQid(params.get("qid"));
        };

        const handleTopicChange = (event: Event) => {
            const customEvent = event as CustomEvent<CourseTopicChangeDetail>;
            setActiveQid(customEvent.detail?.qid ?? null);
        };

        window.addEventListener("popstate", handlePopState);
        window.addEventListener(COURSE_TOPIC_CHANGE_EVENT, handleTopicChange as EventListener);

        return () => {
            window.removeEventListener("popstate", handlePopState);
            window.removeEventListener(COURSE_TOPIC_CHANGE_EVENT, handleTopicChange as EventListener);
        };
    }, []);

    const [questionStatuses, setQuestionStatuses] = React.useState<
        Record<string, QuestionStatusRecord>
    >({});
    const [isMarkingComplete, setIsMarkingComplete] = React.useState(false);

    React.useEffect(() => {
        let isCancelled = false;

        const fetchQuestionStatus = async () => {
            try {
                const response = await fetch(
                    `/api/lms/submodules/${submoduleSlug}/question-status`,
                    { cache: "no-store" },
                );
                const payload = await response.json();

                if (!response.ok) {
                    throw new Error(payload.error || "Failed to load question status");
                }

                if (isCancelled) {
                    return;
                }

                setQuestionStatuses(
                    Object.fromEntries(
                        (payload.questions ?? []).map((question: {
                            id: string;
                            attempted?: boolean;
                            completed?: boolean;
                            taskNumber?: number | null;
                        }) => [
                            question.id,
                            {
                                attempted: Boolean(question.attempted),
                                completed: Boolean(question.completed),
                                taskNumber:
                                    typeof question.taskNumber === "number"
                                        ? question.taskNumber
                                        : null,
                            },
                        ]),
                    ),
                );
            } catch (error) {
                console.error("Failed to load attempt status", error);
                if (!isCancelled) {
                    setQuestionStatuses({});
                }
            }
        };

        void fetchQuestionStatus();
        window.addEventListener("focus", fetchQuestionStatus);
        window.addEventListener(
            COURSE_STATUS_CHANGE_EVENT,
            fetchQuestionStatus as EventListener,
        );

        return () => {
            isCancelled = true;
            window.removeEventListener("focus", fetchQuestionStatus);
            window.removeEventListener(
                COURSE_STATUS_CHANGE_EVENT,
                fetchQuestionStatus as EventListener,
            );
        };
    }, [submoduleSlug]);

    const selectedQuestion = activeQid
        ? questions.find((q) => q.id === activeQid)
        : null;

    const activeQuestion = selectedQuestion ?? (questions.length > 0 ? questions[0] : null);
    const activeQuestionIndex = activeQuestion
        ? questions.findIndex((question) => question.id === activeQuestion.id)
        : -1;

    const hasQuestions = questions.length > 0;

    const goToQuestion = React.useCallback((questionId: string) => {
        if (typeof window === "undefined") return;

        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("qid", questionId);

        const query = currentUrl.searchParams.toString();
        const nextUrl = query ? `${currentUrl.pathname}?${query}` : currentUrl.pathname;

        window.history.pushState({}, "", nextUrl);
        setActiveQid(questionId);
        dispatchCourseTopicChange(questionId);
    }, []);

    const previousQuestion = activeQuestionIndex > 0 ? questions[activeQuestionIndex - 1] : null;
    const nextQuestion = activeQuestionIndex >= 0 && activeQuestionIndex < questions.length - 1
        ? questions[activeQuestionIndex + 1]
        : null;
    const activeQuestionStatus = activeQuestion
        ? questionStatuses[activeQuestion.id] ?? {
            attempted: false,
            completed: false,
            taskNumber: null,
        }
        : null;
    const hasAttemptedActiveQuestion = Boolean(activeQuestionStatus?.attempted);
    const hasCompletedActiveQuestion = Boolean(activeQuestionStatus?.completed);
    const isActiveTask = Boolean(activeQuestion && isTaskQuestionType(activeQuestion.type));
    const isActiveResource = Boolean(activeQuestion && !isTaskQuestionType(activeQuestion.type));
    const activeQuestionContentHtml = activeQuestion ? getQuestionContentHtml(activeQuestion) : "";
    const activeCourseObjectives = activeQuestion?.course_objectives ?? [];
    const simulationLaunchConfig = React.useMemo(
        () => getSimulationLaunchConfig({ moduleSlug, simulatorType }),
        [moduleSlug, simulatorType],
    );
    const totalTaskCount = React.useMemo(
        () => questions.filter((question) => isTaskQuestionType(question.type)).length,
        [questions],
    );

    const handleMarkAsDone = React.useCallback(async () => {
        if (!activeQuestion || isTaskQuestionType(activeQuestion.type) || hasCompletedActiveQuestion) {
            return;
        }

        setIsMarkingComplete(true);

        try {
            const response = await fetch(
                `/api/lms/questions/${activeQuestion.id}/completion`,
                {
                    method: "POST",
                },
            );
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || "Failed to mark task as completed");
            }

            setQuestionStatuses((current) => ({
                ...current,
                [activeQuestion.id]: {
                    attempted: current[activeQuestion.id]?.attempted ?? false,
                    completed: true,
                    taskNumber: current[activeQuestion.id]?.taskNumber ?? null,
                },
            }));
            dispatchCourseStatusChange(activeQuestion.id);
        } catch (error) {
            console.error("Failed to mark task as completed", error);
        } finally {
            setIsMarkingComplete(false);
        }
    }, [activeQuestion, hasCompletedActiveQuestion]);

    return (
        <div className="flex container mx-auto flex-1 flex-col gap-6 p-6 pb-32">
            <div>
                <LmsBreadcrumbs items={breadcrumbs} />
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
                {activeQuestion && (
                    <div className="mt-1 flex flex-col gap-3">
                        <p className="text-muted-foreground text-sm">
                            {isTaskQuestionType(activeQuestion.type)
                                ? `Task ${activeQuestionStatus?.taskNumber ?? 1} of ${totalTaskCount}`
                                : `${getQuestionTypeLabel(activeQuestion.type)} Resource`}
                        </p>
                        <div className="flex flex-col gap-2">
                            <h2 className="text-xl font-semibold text-foreground">
                                {activeQuestion.title}
                            </h2>
                            {activeCourseObjectives.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {activeCourseObjectives.map((objective) => (
                                        <Badge
                                            key={objective}
                                            variant="secondary"
                                            className="bg-blue-100 text-blue-800 hover:bg-blue-100"
                                        >
                                            {objective}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <Separator className="bg-border" />

            {hasQuestions && activeQuestion ? (
                <div key={activeQuestion.id} id={`question-${activeQuestion.id}`} className="flex flex-col gap-6">
                    {activeQuestionContentHtml && (
                        <Card className="border-blue-200 bg-blue-50/30 dark:border-blue-900/50 dark:bg-blue-900/10">
                            <CardContent className="pt-6">
                                <RichQuestionContent
                                    html={activeQuestionContentHtml}
                                    variant={isTaskQuestionType(activeQuestion.type) ? "task" : "resource"}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {activeQuestion.has_table &&
                        activeQuestion.table_data && (
                        <Card className="border-border bg-card">
                            <CardContent className="pt-6">
                                <QuestionTable tableData={activeQuestion.table_data} />
                            </CardContent>
                        </Card>
                    )}
                    {activeQuestion.has_image &&
                        activeQuestion.image_url && (
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

                    {activeQuestion.type === "video" && activeQuestion.video_url && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground ml-1">
                                <Play className="size-4" />
                                <span>{getQuestionTypeLabel(activeQuestion.type)}</span>
                            </div>
                            <YoutubeEmbed url={activeQuestion.video_url} />
                        </div>
                    )}

                    {activeQuestion.type === "document" && activeQuestion.link_url && (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground ml-1">
                                <ExternalLink className="size-4" />
                                <span>{getQuestionTypeLabel(activeQuestion.type)}</span>
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
                <div className="flex container mx-auto items-center justify-between gap-4 px-4 md:px-6">
                    <div className="flex items-center gap-4 ml-4 md:ml-8">
                        {hasQuestions && (
                            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-2 shadow-sm">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2"
                                    disabled={!previousQuestion}
                                    onClick={() => previousQuestion && goToQuestion(previousQuestion.id)}
                                >
                                    <ChevronLeft className="size-4" />
                                    Previous
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2"
                                    disabled={!nextQuestion}
                                    onClick={() => nextQuestion && goToQuestion(nextQuestion.id)}
                                >
                                    Next
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        {activeQuestion && (
                            <>
                                {isActiveResource && (
                                    <Button
                                        variant={hasCompletedActiveQuestion ? "secondary" : "outline"}
                                        size="lg"
                                        className="gap-2 px-8 font-semibold"
                                        disabled={hasCompletedActiveQuestion || isMarkingComplete}
                                        onClick={() => void handleMarkAsDone()}
                                    >
                                        {isMarkingComplete
                                            ? "Saving..."
                                            : hasCompletedActiveQuestion
                                            ? "Completed"
                                            : "Mark as Done"}
                                    </Button>
                                )}
                                {isActiveTask && (
                                    <Button
                                        size="lg"
                                        className="gap-2 px-10 font-bold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground"
                                        disabled={!hasQuestions || !simulationLaunchConfig}
                                        onClick={() => {
                                            if (typeof window === "undefined" || !simulationLaunchConfig) {
                                                return;
                                            }

                                            const { storageKey, gatewayPath } = simulationLaunchConfig;

                                            try {
                                                if (storageKey) {
                                                    window.localStorage.setItem(storageKey, "true");
                                                }
                                            } catch {
                                                // ignore storage errors
                                            }

                                            window.open(
                                                activeQuestion ? `${gatewayPath}?questionId=${activeQuestion.id}` : gatewayPath,
                                                "_blank",
                                                "noopener,noreferrer",
                                            );
                                        }}
                                    >
                                        {simulationLaunchConfig
                                            ? hasAttemptedActiveQuestion
                                                ? "Re-do Task"
                                                : "Start Task"
                                            : "Simulation Unavailable"}{" "}
                                        <ArrowRight className="size-4" />
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
