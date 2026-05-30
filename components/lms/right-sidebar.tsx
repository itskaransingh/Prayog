"use client";

import { useEffect, useState } from "react";
import { Trophy, Target, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

interface LeaderboardEntry {
    rank: number;
    name: string;
    initials: string;
    user_id?: string;
    total_xp?: number;
    xp?: string;
    medal?: string | null;
    isYou?: boolean;
}

const PLACEHOLDER_LEADERBOARD: LeaderboardEntry[] = [
    { rank: 1, name: "Priya K.", xp: "2,880", medal: "🥇", initials: "PK", isYou: false },
    { rank: 2, name: "Rohan M.", xp: "2,510", medal: "", initials: "RM", isYou: false },
    { rank: 3, name: "Sneha G.", xp: "2,200", medal: "🥉", initials: "SG", isYou: false },
    { rank: 4, name: "You", xp: "—", medal: null, initials: "?", isYou: true },
];

export function RightSidebar() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const res = await fetch("/api/leaderboard?limit=5");
                if (res.ok) {
                    const data = await res.json();
                    setLeaderboard(data.entries);
                }
            } catch (error) {
                console.error("Failed to load leaderboard:", error);
                setLeaderboard(PLACEHOLDER_LEADERBOARD);
            } finally {
                setLoading(false);
            }
        }

        fetchLeaderboard();
    }, []);

    const displayLeaderboard = leaderboard.length > 0 ? leaderboard : PLACEHOLDER_LEADERBOARD;

    return (
        <aside className="w-64 flex-shrink-0 bg-muted/30 dark:bg-slate-900/30 border-l border-border dark:border-slate-800 overflow-y-auto">
            <div className="p-3.5 flex flex-col gap-3.5">
                {/* Daily Quest */}
                <div>
                    <div className="flex items-center justify-between mb-2.5">
                        <h3 className="font-bold text-foreground dark:text-slate-100 flex items-center gap-1.5 text-sm">
                            <Target className="h-4 w-4 text-blue-500" />
                            Daily Quest
                        </h3>
                        <span className="text-[11px] text-muted-foreground dark:text-slate-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            10h 30m
                        </span>
                    </div>
                    <div className="bg-card dark:bg-slate-900/80 border border-border dark:border-slate-800 rounded-lg p-3">
                        <div className="flex items-center gap-3 mb-2.5">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-lg">🎯</div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground dark:text-slate-100">Complete 1 assignment</div>
                                <div className="text-[11px] text-blue-600 dark:text-blue-400">+150 XP</div>
                            </div>
                        </div>
                        <div className="h-1.5 bg-muted dark:bg-slate-700 rounded-full overflow-hidden mb-1">
                            <div className="h-full w-0 bg-blue-500 rounded-full" />
                        </div>
                        <div className="text-[11px] text-muted-foreground dark:text-slate-500 text-right">0 / 1</div>
                    </div>
                </div>

                {/* Weekly Quest */}
                <div>
                    <div className="flex items-center justify-between mb-2.5">
                        <h3 className="font-bold text-foreground dark:text-slate-100 flex items-center gap-1.5 text-sm">
                            <Clock className="h-4 w-4 text-amber-500" />
                            Weekly Quest
                        </h3>
                    </div>
                    <div className="bg-card dark:bg-slate-900/80 border border-border dark:border-slate-800 rounded-lg p-3 mb-2.5">
                        <div className="flex items-center gap-3 mb-2.5">
                            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-lg">🧩</div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-foreground dark:text-slate-100">Complete 5 tasks</div>
                                <div className="text-[11px] text-amber-600 dark:text-amber-400">+500 XP</div>
                            </div>
                        </div>
                        <div className="h-1.5 bg-muted dark:bg-slate-700 rounded-full overflow-hidden mb-1">
                            <div className="h-full w-[60%] bg-amber-500 rounded-full" />
                        </div>
                        <div className="text-[11px] text-muted-foreground dark:text-slate-500 text-right">3 / 5</div>
                    </div>
                    <Link
                        href="/quests"
                        className="w-full flex items-center justify-center gap-1 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                        View All Quests
                        <ChevronRight className="w-4 w-4" />
                    </Link>
                </div>

                {/* Divider */}
                <div className="h-px bg-border dark:bg-slate-800" />

                {/* Leaderboard */}
                <div>
                    <div className="flex items-center justify-between mb-2.5">
                        <h3 className="font-bold text-foreground dark:text-slate-100 flex items-center gap-1.5 text-sm">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            Top Learners
                        </h3>
                        <Link href="/leaderboard" className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline">
                            View all
                        </Link>
                    </div>

                    <div className="space-y-1">
                        {displayLeaderboard.map((entry) => (
                            <div
                                key={entry.rank}
                                className={`flex items-center gap-2 p-2 rounded-lg ${
                                    entry.isYou
                                        ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/50"
                                        : ""
                                }`}
                            >
                                <span className="w-6 text-center text-sm">
                                    {entry.medal || (entry.rank <= 3 ? "" : `#${entry.rank}`)}
                                </span>
                                <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                        entry.isYou
                                            ? "bg-gradient-to-br from-blue-600 to-blue-400 text-white"
                                            : "bg-gradient-to-br from-slate-400 to-slate-200 text-slate-700 dark:from-slate-600 dark:to-slate-400 dark:text-slate-200"
                                    }`}
                                >
                                    {entry.initials}
                                </div>
                                <span
                                    className={`flex-1 text-sm ${
                                        entry.isYou
                                            ? "font-semibold text-foreground dark:text-slate-100"
                                            : "text-foreground dark:text-slate-300"
                                    }`}
                                >
                                    {entry.name}
                                </span>
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                    {typeof entry.total_xp === "number" ? `${entry.total_xp.toLocaleString()}` : entry.xp}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
}