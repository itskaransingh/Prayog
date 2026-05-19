"use client";

import { Trophy, Target, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

const LEADERBOARD = [
    { rank: 1, name: "Priya K.", xp: "2,880", medal: "🥇", initials: "PK", isYou: false },
    { rank: 2, name: "Rohan M.", xp: "2,510", medal: "🥈", initials: "RM", isYou: false },
    { rank: 3, name: "Sneha G.", xp: "2,200", medal: "🥉", initials: "SG", isYou: false },
    { rank: 12, name: "You", xp: "1,260", medal: null, initials: "AS", isYou: true },
];

export function RightSidebar() {
    return (
        <aside className="w-64 flex-shrink-0 bg-muted/30 dark:bg-slate-900/30 border-l border-border dark:border-slate-800 overflow-y-auto">
            <div className="p-3 flex flex-col gap-3">
                {/* Daily Quest - Compact */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-foreground dark:text-slate-100 flex items-center gap-1.5 text-sm">
                            <Target className="h-3.5 w-3.5 text-blue-500" />
                            Daily Quest
                        </h3>
                        <span className="text-[10px] text-muted-foreground dark:text-slate-400 flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            10h 30m
                        </span>
                    </div>
                    <div className="bg-card dark:bg-slate-900/80 border border-border dark:border-slate-800 rounded-lg p-2.5">
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-base">🎯</div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-foreground dark:text-slate-100">Complete 1 assignment</div>
                                <div className="text-[10px] text-blue-600 dark:text-blue-400">+150 XP</div>
                            </div>
                        </div>
                        <div className="h-1 bg-muted dark:bg-slate-700 rounded-full overflow-hidden mb-0.5">
                            <div className="h-full w-0 bg-blue-500 rounded-full" />
                        </div>
                        <div className="text-[10px] text-muted-foreground dark:text-slate-500 text-right">0 / 1</div>
                    </div>
                </div>

                {/* Weekly Quest - Compact */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-foreground dark:text-slate-100 flex items-center gap-1.5 text-sm">
                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                            Weekly Quest
                        </h3>
                    </div>
                    <div className="bg-card dark:bg-slate-900/80 border border-border dark:border-slate-800 rounded-lg p-2.5 mb-2">
                        <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-base">🧩</div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-foreground dark:text-slate-100">Complete 5 tasks</div>
                                <div className="text-[10px] text-amber-600 dark:text-amber-400">+500 XP</div>
                            </div>
                        </div>
                        <div className="h-1 bg-muted dark:bg-slate-700 rounded-full overflow-hidden mb-0.5">
                            <div className="h-full w-[60%] bg-amber-500 rounded-full" />
                        </div>
                        <div className="text-[10px] text-muted-foreground dark:text-slate-500 text-right">3 / 5</div>
                    </div>
                    <Link
                        href="/quests"
                        className="w-full flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                    >
                        View All Quests
                        <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>

                {/* Divider */}
                <div className="h-px bg-border dark:bg-slate-800" />

                {/* Leaderboard - Compact */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-foreground dark:text-slate-100 flex items-center gap-1.5 text-sm">
                            <Trophy className="h-3.5 w-3.5 text-amber-500" />
                            Top Learners
                        </h3>
                        <Link href="/leaderboard" className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline">
                            View all
                        </Link>
                    </div>

                    <div className="space-y-0.5">
                        {LEADERBOARD.map((entry) => (
                            <div
                                key={entry.rank}
                                className={`flex items-center gap-1.5 p-1.5 rounded-md ${
                                    entry.isYou
                                        ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/50"
                                        : ""
                                }`}
                            >
                                <span className="w-5 text-center text-xs">
                                    {entry.medal || `#${entry.rank}`}
                                </span>
                                <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                        entry.isYou
                                            ? "bg-gradient-to-br from-blue-600 to-blue-400 text-white"
                                            : "bg-gradient-to-br from-slate-400 to-slate-200 text-slate-700 dark:from-slate-600 dark:to-slate-400 dark:text-slate-200"
                                    }`}
                                >
                                    {entry.initials}
                                </div>
                                <span
                                    className={`flex-1 text-xs ${
                                        entry.isYou
                                            ? "font-semibold text-foreground dark:text-slate-100"
                                            : "text-foreground dark:text-slate-300"
                                    }`}
                                >
                                    {entry.name}
                                </span>
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                    {entry.xp}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
}
