"use client";

import { useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    Cell,
    CartesianGrid,
    Label,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { ChartPie, BarChart3, Sparkles, CircleAlert, Frown } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

type Analytics = {
    chapterDifficulty: Array<{
        chapter_id: string;
        chapter_name: string;
        course_name: string;
        average_score: number;
    }>;
    scoreDistribution: Array<{ label: string; count: number }>;
    completionRate: Array<{
        chapter_id: string;
        chapter_name: string;
        course_name: string;
        completion_rate: number;
    }>;
    sparklines: Array<{
        user_id: string;
        full_name: string;
        email: string;
        average_score: number;
        attempt_count: number;
        trend: Array<{ x: number; y: number; trendY: number }>;
    }>;
};

type Props = {
    analytics: Analytics | null;
    isLoading: boolean;
    error: string | null;
    isEmpty: boolean;
    mode: "course" | "chapter";
};

const semanticColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function truncateLabel(value: string, maxLength = 18) {
    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength - 1)}…`;
}

function RotatedTick({
    x,
    y,
    payload,
    maxLength,
}: {
    x?: number;
    y?: number;
    payload?: { value?: string };
    maxLength: number;
}) {
    const label = truncateLabel(String(payload?.value ?? ""), maxLength);

    return (
        <g transform={`translate(${x ?? 0},${y ?? 0}) rotate(-35)`}>
            <text
                fill="currentColor"
                fontSize={10}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted-foreground"
            >
                {label}
            </text>
        </g>
    );
}

function EmptyState() {
    return (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Frown className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">No data available</p>
            <p className="mt-1 text-xs text-muted-foreground">Try widening the course, chapter, or student filters.</p>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <Skeleton className="mb-4 h-5 w-40" />
                    <Skeleton className="h-64 w-full" />
                </div>
            ))}
        </div>
    );
}

export function ResultsAnalytics({ analytics, isLoading, error, isEmpty, mode }: Props) {
    const [sparkMode, setSparkMode] = useState<"top" | "bottom" | "all">("top");

    const sparklineUsers = useMemo(() => {
        if (!analytics) return [];
        if (sparkMode === "all") return analytics.sparklines;
        const sorted = [...analytics.sparklines].sort((a, b) => a.average_score - b.average_score);
        return sparkMode === "top" ? sorted.slice(-10).reverse() : sorted.slice(0, 10);
    }, [analytics, sparkMode]);

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                <div className="flex items-start gap-3">
                    <CircleAlert className="mt-0.5 h-5 w-5" />
                    <div>
                        <p className="font-semibold">Failed to load analytics</p>
                        <p className="mt-1 text-xs opacity-90">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (isEmpty || !analytics) {
        return <EmptyState />;
    }

    return (
        <div className="space-y-6">
            {mode === "course" ? (
                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="rounded-2xl border border-border bg-card shadow-sm">
                        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            <div>
                                <h4 className="font-semibold text-foreground">Chapter Difficulty</h4>
                                <p className="text-xs text-muted-foreground">Average score by chapter</p>
                            </div>
                        </div>
                        <div className="flex h-[19rem]">
                            <div className="flex items-center justify-center px-2 py-4 text-xs font-medium text-muted-foreground" style={{ width: '80px' }}>
                                <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', transformOrigin: 'center' }}>
                                    Average score (%)
                                </div>
                            </div>
                            <div className="flex-1 p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={analytics.chapterDifficulty}
                                        margin={{ top: 8, right: 16, left: 0, bottom: 76 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                        <XAxis
                                            dataKey="chapter_name"
                                            tick={(props) => <RotatedTick {...props} maxLength={16} />}
                                            interval={0}
                                            height={78}
                                            tickMargin={18}
                                        >
                                            <Label value="Chapter" offset={-56} position="insideBottom" className="fill-muted-foreground text-xs" />
                                        </XAxis>
                                        <YAxis
                                            tick={{ fill: "currentColor", fontSize: 11 }}
                                            domain={[0, 100]}
                                        />
                                        <Tooltip />
                                        <Bar dataKey="average_score" radius={[8, 8, 0, 0]}>
                                            {analytics.chapterDifficulty.map((entry, index) => (
                                                <Cell key={entry.chapter_id} fill={semanticColors[index % semanticColors.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-border bg-card shadow-sm">
                        <div className="flex items-center gap-2 border-b border-border px-6 py-4">
                            <ChartPie className="h-4 w-4 text-primary" />
                            <div>
                                <h4 className="font-semibold text-foreground">Completion Rate</h4>
                                <p className="text-xs text-muted-foreground">Per chapter completion across the selected course</p>
                            </div>
                        </div>
                        <div className="h-72 p-4">
                            {analytics.completionRate.some((entry) => entry.completion_rate > 0) ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={analytics.completionRate} dataKey="completion_rate" nameKey="chapter_name" innerRadius={70} outerRadius={110} paddingAngle={2}>
                                            {analytics.completionRate.map((entry, index) => (
                                                <Cell key={entry.chapter_id} fill={semanticColors[index % semanticColors.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 text-center">
                                    <div className="max-w-sm">
                                        <p className="text-sm font-semibold text-foreground">No completion data yet</p>
                                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                            Completion records will show here once students finish tasks in this course.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-2xl border border-border bg-card shadow-sm">
                    <div className="flex items-center gap-2 border-b border-border px-6 py-4">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <div>
                            <h4 className="font-semibold text-foreground">Score Distribution</h4>
                            <p className="text-xs text-muted-foreground">Dynamic score buckets for the current filter</p>
                        </div>
                    </div>
                    <div className="flex h-[19rem]">
                        <div className="flex items-center justify-center px-2 py-4 text-xs font-medium text-muted-foreground" style={{ width: '80px' }}>
                            <div style={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap', transformOrigin: 'center' }}>
                                Attempt count
                            </div>
                        </div>
                        <div className="flex-1 p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={analytics.scoreDistribution}
                                    margin={{ top: 8, right: 16, left: 0, bottom: 68 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis
                                        dataKey="label"
                                        tick={(props) => <RotatedTick {...props} maxLength={12} />}
                                        interval={0}
                                        height={72}
                                        tickMargin={18}
                                    >
                                        <Label value="Score bucket" offset={-48} position="insideBottom" className="fill-muted-foreground text-xs" />
                                    </XAxis>
                                    <YAxis
                                        tick={{ fill: "currentColor", fontSize: 11 }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="var(--chart-4)" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <div>
                                <h4 className="font-semibold text-foreground">Student Sparklines</h4>
                                <p className="text-xs text-muted-foreground">Attempt chronology with trend lines</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                            {(["top", "bottom", "all"] as const).map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setSparkMode(option)}
                                    className={`rounded-full px-3 py-1 font-medium transition ${
                                        sparkMode === option
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {option === "top" ? "Top 10" : option === "bottom" ? "Bottom 10" : "Full list"}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="max-h-[30rem] overflow-auto p-4">
                        <div className="grid gap-4">
                            {sparklineUsers.map((user) => (
                                <div key={user.user_id} className="rounded-xl border border-border bg-muted/20 p-4">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-foreground">{user.full_name}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                        <div className="text-right text-xs text-muted-foreground">
                                            <p>{user.attempt_count} attempts</p>
                                            <p>{user.average_score.toFixed(1)}% avg</p>
                                        </div>
                                    </div>
                                    <div className="h-28">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={user.trend}>
                                                <XAxis dataKey="x" hide />
                                                <YAxis hide domain={[0, 100]} />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="y" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                                                <Line type="monotone" dataKey="trendY" stroke="var(--chart-4)" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {mode === "chapter" ? (
                <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                    Chapter mode is focused on score distribution and student trends; completion and chapter difficulty remain available in course mode only.
                </div>
            ) : null}
        </div>
    );
}
