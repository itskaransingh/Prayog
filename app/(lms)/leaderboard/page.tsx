"use client";

import { useEffect, useState } from "react";
import { Trophy, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface LeaderboardEntry {
    rank: number;
    user_id: string;
    name: string;
    initials: string;
    total_xp: number;
    isYou?: boolean;
}

export default function LeaderboardPage() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [yourRank, setYourRank] = useState<number | null>(null);
    const [yourXP, setYourXP] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const res = await fetch("/api/leaderboard?limit=50");
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                setEntries(data.entries);
                setYourRank(data.yourRank);
                setYourXP(data.yourXP);
            } catch (error) {
                console.error("Failed to load leaderboard:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchLeaderboard();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <div className="text-muted-foreground">Loading leaderboard...</div>
            </div>
        );
    }

    const topThree = entries.slice(0, 3);

    return (
        <div className="mx-auto flex flex-1 flex-col gap-6 container p-5">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="mb-1 text-sm font-medium text-muted-foreground">Rankings</p>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-slate-100">
                        Top Learners
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

            {yourRank && yourXP !== null && (
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-80">Your Position</p>
                            <p className="text-3xl font-bold">#{yourRank}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm opacity-80">Total XP</p>
                            <p className="text-3xl font-bold">{yourXP.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}

            {entries.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                    <p className="text-muted-foreground">No leaderboard data yet.</p>
                </div>
            ) : (
                <>
                    {topThree.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                            {topThree.map((entry, index) => {
                                const position = index + 1;
                                const medal = position === 1 ? "🥇" : position === 2 ? "🥈" : position === 3 ? "🥉" : "";

                                return (
                                    <div
                                        key={entry.user_id}
                                        className={`relative flex flex-col items-center rounded-xl p-4 ${
                                            position === 1
                                                ? "bg-gradient-to-b from-amber-400/20 to-amber-600/10 border border-amber-500/30 order-2"
                                                : position === 2
                                                    ? "bg-gradient-to-b from-slate-300/20 to-slate-500/10 border border-slate-400/30 order-1"
                                                    : "bg-gradient-to-b from-orange-400/20 to-orange-600/10 border border-orange-500/30 order-3"
                                        }`}
                                    >
                                        {position === 1 && (
                                            <div className="absolute -top-3">
                                                <Trophy className="h-6 w-6 text-amber-500" />
                                            </div>
                                        )}
                                        <div
                                            className={`mb-2 flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg ${
                                                position === 1
                                                    ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                                                    : position === 2
                                                        ? "bg-gradient-to-br from-slate-400 to-slate-600 text-white"
                                                        : "bg-gradient-to-br from-orange-400 to-orange-600 text-white"
                                            }`}
                                        >
                                            {entry.initials}
                                        </div>
                                        <p className="text-sm font-semibold text-foreground dark:text-slate-100 text-center truncate max-w-full">
                                            {entry.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground mb-1">{medal || `#${position}`}</p>
                                        <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                            {entry.total_xp.toLocaleString()} XP
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className="bg-card dark:bg-slate-900/50 border border-border dark:border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border dark:border-slate-800">
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Rank</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Learner</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">XP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.slice(3).map((entry) => (
                                    <tr
                                        key={entry.user_id}
                                        className={`border-b border-border dark:border-slate-800 ${
                                            entry.isYou ? "bg-blue-50 dark:bg-blue-900/20" : ""
                                        }`}
                                    >
                                        <td className="py-3 px-4">
                                            <span className="text-sm font-medium text-muted-foreground">#{entry.rank}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                                        entry.isYou
                                                            ? "bg-gradient-to-br from-blue-600 to-blue-400 text-white"
                                                            : "bg-muted dark:bg-slate-700 text-muted-foreground"
                                                    }`}
                                                >
                                                    {entry.initials}
                                                </div>
                                                <span
                                                    className={`text-sm ${
                                                        entry.isYou
                                                            ? "font-semibold text-foreground dark:text-slate-100"
                                                            : "text-foreground dark:text-slate-300"
                                                    }`}
                                                >
                                                    {entry.name}
                                                    {entry.isYou && <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                {entry.total_xp.toLocaleString()} XP
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}