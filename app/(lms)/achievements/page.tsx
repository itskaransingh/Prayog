"use client";

import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import { ArrowLeft, BookOpen, Calculator, Landmark, Repeat, Target, CheckCircle2, Lock, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";

interface TaskXPEntry {
    chapterTitle: string;
    topicNumber: number;
    attemptOrdinal: string;
    xp: number;
    earnedAt: string;
}

interface ContentXPEntry {
    chapterTitle: string;
    topicNumber: number;
    xp: number;
    earnedAt: string;
}

interface AchievementXPEntry {
    achievementTitle: string;
    xp: number;
    earnedAt: string;
}

interface XPPaginatedSection {
    entries: TaskXPEntry[] | ContentXPEntry[] | AchievementXPEntry[];
    pagination: {
        total: number;
        page: number;
        perPage: number;
        hasMore: boolean;
    };
}

interface AchievementCard {
    key: string;
    title: string;
    desc: string;
    xp: string;
    image?: string;
    icon?: ComponentType<{ className?: string }>;
    bgClass: string;
    iconClass: string;
}

const ACHIEVEMENTS: AchievementCard[] = [
    { key: "first_try_ace", title: "First Try Ace", desc: "Complete a task with 100% accuracy on the 1st attempt", xp: "25 XP", image: "/achievements/star.png", bgClass: "bg-rose-100 dark:bg-rose-950/40", iconClass: "text-rose-600 dark:text-rose-300" },
    { key: "quick_mastery", title: "Quick Mastery", desc: "Complete a task with 100% accuracy on the 2nd attempt", xp: "25 XP", image: "/achievements/bag.png", bgClass: "bg-violet-100 dark:bg-violet-950/40", iconClass: "text-violet-600 dark:text-violet-300" },
    { key: "accuracy_builder", title: "Accuracy Builder", desc: "Reach 80%+ average accuracy across 5 completed tasks", xp: "40 XP", image: "/achievements/accuracy.png", bgClass: "bg-cyan-100 dark:bg-cyan-950/40", iconClass: "text-cyan-600 dark:text-cyan-300" },
    { key: "practice_streak", title: "Practice Streak", desc: "Complete tasks on 3 consecutive study days", xp: "30 XP", image: "/achievements/fire.png", bgClass: "bg-red-100 dark:bg-red-950/40", iconClass: "text-red-600 dark:text-red-300" },
    { key: "comeback_scholar", title: "Comeback Scholar", desc: "Recover from an incorrect attempt and still complete the task", xp: "25 XP", icon: Repeat, bgClass: "bg-amber-100 dark:bg-amber-950/40", iconClass: "text-amber-600 dark:text-amber-300" },
    { key: "chapter_closer", title: "Chapter Closer", desc: "Complete all tasks in a chapter", xp: "30 XP", icon: BookOpen, bgClass: "bg-sky-100 dark:bg-sky-950/40", iconClass: "text-sky-600 dark:text-sky-300" },
    { key: "accounting_explorer", title: "Accounting Explorer", desc: "Complete at least one task in every chapter that contains tasks", xp: "50 XP", image: "/achievements/shield.png", bgClass: "bg-indigo-100 dark:bg-indigo-950/40", iconClass: "text-indigo-600 dark:text-indigo-300" },
    { key: "ledger_starter", title: "Ledger Starter", desc: "Complete the first Ledger-type task successfully", xp: "25 XP", icon: Landmark, bgClass: "bg-emerald-100 dark:bg-emerald-950/40", iconClass: "text-emerald-600 dark:text-emerald-300" },
    { key: "trial_balance_tracker", title: "Trial Balance Tracker", desc: "Complete the first Trial Balance-type task successfully", xp: "30 XP", icon: Target, bgClass: "bg-orange-100 dark:bg-orange-950/40", iconClass: "text-orange-600 dark:text-orange-300" },
    { key: "statement_builder", title: "Statement Builder", desc: "Complete the first Financial Statement-type task successfully", xp: "35 XP", icon: Calculator, bgClass: "bg-teal-100 dark:bg-teal-950/40", iconClass: "text-teal-600 dark:text-teal-300" },
    { key: "accounting_master", title: "Accounting Master", desc: "Complete all tasks in the Financial Accounting course", xp: "100 XP", image: "/achievements/trophy.png", bgClass: "bg-fuchsia-100 dark:bg-fuchsia-950/40", iconClass: "text-fuchsia-600 dark:text-slate-100" },
];

interface UserAchievement {
    id: string;
    achievement_key: string;
    xp_awarded: number;
    awarded_at: string;
}

interface XPFetchState {
    taskXP: XPPaginatedSection | null;
    contentXP: XPPaginatedSection | null;
    achievementXP: XPPaginatedSection | null;
    achievementsUnlocked: number;
}

function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

function XPSection({
    title,
    entries,
    hasMore,
    loading,
    onLoadMore,
}: {
    title: string;
    entries: unknown[];
    hasMore: boolean;
    loading: boolean;
    onLoadMore: () => void;
}) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="border border-border dark:border-slate-800 rounded-lg overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-3 bg-muted/30 dark:bg-slate-900/30 hover:bg-muted/50 dark:hover:bg-slate-900/50 transition-colors"
            >
                <span className="font-medium text-sm">{title}</span>
                <div className="flex items-center gap-2">
                    {entries.length > 0 && (
                        <span className="text-xs text-muted-foreground">{entries.length} entries</span>
                    )}
                    {expanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            </button>

            {expanded && (
                <div className="p-3 space-y-2">
                    {entries.length === 0 && !loading && (
                        <p className="text-sm text-muted-foreground text-center py-4">No entries yet</p>
                    )}
                    {entries.map((entry, idx) => {
                        const e = entry as Record<string, unknown>;
                        if ("attemptOrdinal" in e) {
                            const t = e as { chapterTitle: string; topicNumber: number; attemptOrdinal: string; xp: number; earnedAt: string };
                            return (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <span className="text-foreground dark:text-slate-200">
                                        {t.chapterTitle} - Topic {t.topicNumber} - {t.attemptOrdinal} attempt
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-blue-600 dark:text-blue-400">{t.xp} XP</span>
                                        <span className="text-xs text-muted-foreground">{formatTimeAgo(t.earnedAt)}</span>
                                    </div>
                                </div>
                            );
                        } else if ("achievementTitle" in e) {
                            const a = e as { achievementTitle: string; xp: number; earnedAt: string };
                            return (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <span className="text-foreground dark:text-slate-200">{a.achievementTitle}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-blue-600 dark:text-blue-400">{a.xp} XP</span>
                                        <span className="text-xs text-muted-foreground">{formatTimeAgo(a.earnedAt)}</span>
                                    </div>
                                </div>
                            );
                        } else {
                            const c = e as { chapterTitle: string; topicNumber: number; xp: number; earnedAt: string };
                            return (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <span className="text-foreground dark:text-slate-200">
                                        {c.chapterTitle} - Topic {c.topicNumber}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-blue-600 dark:text-blue-400">{c.xp} XP</span>
                                        <span className="text-xs text-muted-foreground">{formatTimeAgo(c.earnedAt)}</span>
                                    </div>
                                </div>
                            );
                        }
                    })}
                    {loading && (
                        <div className="flex items-center justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    )}
                    {hasMore && !loading && (
                        <button
                            onClick={onLoadMore}
                            className="w-full text-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 py-1"
                        >
                            Load more
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function AchievementsPage() {
    const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
    const [totalXP, setTotalXP] = useState(0);
    const [loading, setLoading] = useState(true);
    const [xpData, setXPData] = useState<XPFetchState>({
        taskXP: null,
        contentXP: null,
        achievementXP: null,
        achievementsUnlocked: 0,
    });
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch("/api/xp");
                if (res.ok) {
                    const data = await res.json();
                    setTotalXP(data.totalXP);
                    setXPData({
                        taskXP: data.taskXP,
                        contentXP: data.contentXP,
                        achievementXP: data.achievementXP,
                        achievementsUnlocked: data.achievementsUnlocked,
                    });
                    setUserAchievements(data.achievementXP?.entries ?? []);
                }
            } catch (error) {
                console.error("Failed to fetch achievements:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    async function loadMore(section: "task" | "content" | "achievement") {
        const currentPage = xpData[`${section}XP`]?.pagination.page ?? 1;
        const nextPage = currentPage + 1;

        setLoadingMore(true);
        try {
            const res = await fetch(`/api/xp?page=${nextPage}`);
            if (res.ok) {
                const data = await res.json();
                setXPData((prev) => ({
                    ...prev,
                    [`${section}XP`]: {
                        entries: [...(prev[`${section}XP`]?.entries ?? []), ...data[`${section}XP`].entries],
                        pagination: data[`${section}XP`].pagination,
                    },
                }));
            }
        } catch (error) {
            console.error(`Failed to load more ${section} XP:`, error);
        } finally {
            setLoadingMore(false);
        }
    }

    const unlockedKeys = new Set(
        (xpData.achievementXP?.entries ?? []).map((e) => {
            const entry = e as unknown as { achievementKey: string };
            return entry.achievementKey.replace(/^chapter_closer_\d+$/, "chapter_closer");
        }),
    );

    return (
        <div className="mx-auto flex flex-1 flex-col gap-6 container p-5">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="mb-1 text-sm font-medium text-muted-foreground">Achievements</p>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-slate-100">
                        Earn More. Learn More. Level Up!
                    </h1>
                </div>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>
            </div>

            {!loading && (
                <div className="bg-card dark:bg-slate-900/50 border border-border dark:border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Total XP Earned</p>
                            <p className="text-3xl font-bold text-foreground dark:text-slate-100">{totalXP.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Achievements Unlocked</p>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {xpData.achievementsUnlocked} / {ACHIEVEMENTS.length}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <XPSection
                            title="Task XP"
                            entries={xpData.taskXP?.entries ?? []}
                            hasMore={xpData.taskXP?.pagination.hasMore ?? false}
                            loading={loadingMore}
                            onLoadMore={() => loadMore("task")}
                        />
                        <XPSection
                            title="Content XP"
                            entries={xpData.contentXP?.entries ?? []}
                            hasMore={xpData.contentXP?.pagination.hasMore ?? false}
                            loading={loadingMore}
                            onLoadMore={() => loadMore("content")}
                        />
                        <XPSection
                            title="Achievement XP"
                            entries={xpData.achievementXP?.entries ?? []}
                            hasMore={xpData.achievementXP?.pagination.hasMore ?? false}
                            loading={loadingMore}
                            onLoadMore={() => loadMore("achievement")}
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {ACHIEVEMENTS.map((achievement) => {
                    const Icon = achievement.icon;
                    const isUnlocked = unlockedKeys.has(achievement.key);

                    return (
                        <Card
                            key={achievement.key}
                            className={`border-border dark:border-slate-800 ${
                                isUnlocked
                                    ? "bg-card dark:bg-slate-900/50"
                                    : "bg-muted/50 dark:bg-slate-900/20 opacity-60"
                            }`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className={`relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full ${achievement.bgClass}`}>
                                        {achievement.image ? (
                                            <Image
                                                src={achievement.image}
                                                alt={achievement.title}
                                                fill
                                                sizes="48px"
                                                className={`object-cover ${!isUnlocked ? "grayscale" : ""}`}
                                            />
                                        ) : Icon ? (
                                            <div className={`flex h-full w-full items-center justify-center ${achievement.iconClass}`}>
                                                <Icon className="h-6 w-6" />
                                            </div>
                                        ) : null}
                                        {isUnlocked && (
                                            <div className="absolute -bottom-1 -right-1 rounded-full bg-green-500">
                                                <CheckCircle2 className="h-4 w-4 text-white" />
                                            </div>
                                        )}
                                        {!isUnlocked && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                <Lock className="h-5 w-5 text-white/70" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-semibold text-foreground dark:text-slate-100">
                                            {achievement.title}
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground dark:text-slate-400">
                                            {achievement.desc}
                                        </div>
                                        <div className="mt-3 text-xs font-bold text-blue-600 dark:text-blue-400">
                                            {achievement.xp}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}