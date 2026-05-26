import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import { ArrowLeft, BookOpen, Calculator, Landmark, Repeat, Target } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type AchievementCard = {
    title: string;
    desc: string;
    xp: string;
    image?: string;
    icon?: ComponentType<{ className?: string }>;
    bgClass: string;
    iconClass: string;
};

const ACHIEVEMENTS: AchievementCard[] = [
    { title: "First Try Ace", desc: "Complete a task with 100% accuracy on the 1st attempt", xp: "25 XP", image: "/achievements/star.png", bgClass: "bg-rose-100 dark:bg-rose-950/40", iconClass: "text-rose-600 dark:text-rose-300" },
    { title: "Quick Mastery", desc: "Complete a task with 100% accuracy on the 2nd attempt", xp: "25 XP", image: "/achievements/bag.png", bgClass: "bg-violet-100 dark:bg-violet-950/40", iconClass: "text-violet-600 dark:text-violet-300" },
    { title: "Accuracy Builder", desc: "Reach 80%+ average accuracy across 5 completed tasks", xp: "40 XP", image: "/achievements/accuracy.png", bgClass: "bg-cyan-100 dark:bg-cyan-950/40", iconClass: "text-cyan-600 dark:text-cyan-300" },
    { title: "Practice Streak", desc: "Complete tasks on 3 consecutive study days", xp: "30 XP", image: "/achievements/fire.png", bgClass: "bg-red-100 dark:bg-red-950/40", iconClass: "text-red-600 dark:text-red-300" },
    { title: "Comeback Scholar", desc: "Recover from an incorrect attempt and still complete the task", xp: "25 XP", icon: Repeat, bgClass: "bg-amber-100 dark:bg-amber-950/40", iconClass: "text-amber-600 dark:text-amber-300" },
    { title: "Chapter Closer", desc: "Complete all tasks in a chapter", xp: "30 XP", icon: BookOpen, bgClass: "bg-sky-100 dark:bg-sky-950/40", iconClass: "text-sky-600 dark:text-sky-300" },
    { title: "Accounting Explorer", desc: "Complete at least one task in every chapter that contains tasks", xp: "50 XP", image: "/achievements/shield.png", bgClass: "bg-indigo-100 dark:bg-indigo-950/40", iconClass: "text-indigo-600 dark:text-indigo-300" },
    { title: "Ledger Starter", desc: "Complete the first Ledger-type task successfully", xp: "25 XP", icon: Landmark, bgClass: "bg-emerald-100 dark:bg-emerald-950/40", iconClass: "text-emerald-600 dark:text-emerald-300" },
    { title: "Trial Balance Tracker", desc: "Complete the first Trial Balance-type task successfully", xp: "30 XP", icon: Target, bgClass: "bg-orange-100 dark:bg-orange-950/40", iconClass: "text-orange-600 dark:text-orange-300" },
    { title: "Statement Builder", desc: "Complete the first Financial Statement-type task successfully", xp: "35 XP", icon: Calculator, bgClass: "bg-teal-100 dark:bg-teal-950/40", iconClass: "text-teal-600 dark:text-teal-300" },
    { title: "Accounting Master", desc: "Complete all tasks in the Financial Accounting course", xp: "100 XP", image: "/achievements/trophy.png", bgClass: "bg-fuchsia-100 dark:bg-fuchsia-950/40", iconClass: "text-fuchsia-600 dark:text-fuchsia-300" },
];

export default function AchievementsPage() {
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {ACHIEVEMENTS.map((achievement) => {
                    const Icon = achievement.icon;

                    return (
                        <Card key={achievement.title} className="border-border bg-card dark:bg-slate-900/50 dark:border-slate-800">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className={`relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full ${achievement.bgClass}`}>
                                        {achievement.image ? (
                                            <Image
                                                src={achievement.image}
                                                alt={achievement.title}
                                                fill
                                                sizes="48px"
                                                className="object-cover"
                                            />
                                        ) : Icon ? (
                                            <div className={`flex h-full w-full items-center justify-center ${achievement.iconClass}`}>
                                                <Icon className="h-6 w-6" />
                                            </div>
                                        ) : null}
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
