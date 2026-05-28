"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { getSubmoduleHref } from "@/lib/learning-contents";

type ChapterState = "done" | "in-progress" | "locked";

interface FinancialAccountingMapProps {
    courseTitle: string;
    moduleSlug: string;
    chapters: Array<{
        id: string;
        title: string;
        slug: string;
        task_count: number;
        progress: number;
    }>;
}

const CHAPTER_ICONS = ["📖", "📒", "💰", "🏦", "📮", "📝", "🗂️", "⚖️", "📊"];

function getState(progress: number, _index: number): ChapterState {
    if (progress >= 100) return "done";
    return "in-progress";
}

export function FinancialAccountingMap({ courseTitle, moduleSlug, chapters }: FinancialAccountingMapProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const chapterItems = useMemo(
        () =>
            chapters.map((chapter, index) => {
                const state = getState(chapter.progress, index);
                const xp = Math.max(15, Math.round((chapter.progress || 0) * 0.7) + chapter.task_count * 5);
                return {
                    ...chapter,
                    icon: CHAPTER_ICONS[index % CHAPTER_ICONS.length],
                    state,
                    xp,
                };
            }),
        [chapters],
    );

    const activeChapter = chapterItems[activeIndex] ?? chapterItems[0];
    const activeState = activeChapter?.state ?? "locked";
    const isDone = activeState === "done";
    const isLocked = activeState === "locked";

    return (
        <div className="min-h-screen bg-background dark:bg-black text-foreground">
            <style jsx global>{`
                body {
                    background-color: var(--background) !important;
                }
                .dark body {
                    background-color: #000000 !important;
                }

                @keyframes fa-node-bounce {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-3px);
                    }
                }
            `}</style>

            <div
                className="fixed inset-0 pointer-events-none hidden dark:block"
                style={{
                    backgroundImage:
                        "radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.25) 0%, transparent 100%), radial-gradient(1px 1px at 30% 60%, rgba(255,255,255,0.15) 0%, transparent 100%), radial-gradient(1px 1px at 55% 10%, rgba(255,255,255,0.2) 0%, transparent 100%), radial-gradient(1px 1px at 75% 40%, rgba(255,255,255,0.18) 0%, transparent 100%), radial-gradient(1px 1px at 90% 75%, rgba(255,255,255,0.22) 0%, transparent 100%), radial-gradient(1.5px 1.5px at 20% 85%, rgba(255,255,255,0.12) 0%, transparent 100%), radial-gradient(1px 1px at 65% 80%, rgba(255,255,255,0.17) 0%, transparent 100%), radial-gradient(1.5px 1.5px at 45% 45%, rgba(255,255,255,0.1) 0%, transparent 100%)",
                }}
            />

            <main className="relative z-10 mx-auto w-full max-w-[860px] px-7 pb-20 pt-4">
                <div className="mb-2.5 flex items-center gap-1.5 text-[0.82rem] text-muted-foreground dark:text-[#7a82a0]">
                    <Link href="/" className="transition-colors hover:text-foreground dark:hover:text-[#e8eaf0]">Home</Link>
                    <ChevronRight className="size-4" />
                    <Link href="/learning-contents" className="transition-colors hover:text-foreground dark:hover:text-[#e8eaf0]">Learning Contents</Link>
                    <ChevronRight className="size-4" />
                    <span className="font-semibold text-foreground dark:text-[#e8eaf0]">{courseTitle}</span>
                </div>

                <Link href="/learning-contents" className="mb-4 inline-flex items-center gap-1.5 text-[0.85rem] text-muted-foreground dark:text-[#7a82a0] transition-colors hover:text-foreground dark:hover:text-[#e8eaf0]">
                    <ChevronLeft className="size-4" />
                    Back to Courses
                </Link>

                <h1 className="mb-1 font-[family-name:var(--font-geist-sans)] text-[1.9rem] font-extrabold tracking-tight text-foreground">
                    {courseTitle}
                </h1>
                <p className="mb-6 text-[0.88rem] text-muted-foreground dark:text-[#7a82a0]">
                    Select a chapter to view learning content and assignments.
                </p>

                <div className="relative mx-auto max-w-[780px] pb-10">
                    {chapterItems.map((chapter, index) => {
                        const rowRight = index % 2 === 1;
                        const selected = index === activeIndex;
                        return (
                            <div key={chapter.id}>
                                <div className={`relative z-10 flex items-center ${rowRight ? "flex-row-reverse" : ""}`}>
                                    <button
                                        onClick={() => {
                                            setActiveIndex(index);
                                            setIsOpen(true);
                                        }}
                                        className={`group relative shrink-0 transition-transform duration-200 hover:scale-[1.03] ${chapter.state === "locked" ? "cursor-default hover:scale-100" : ""}`}
                                    >
                                        <span className={`absolute inset-[-4px] rounded-full border-2 border-dashed animate-[spin_12s_linear_infinite] ${chapter.state === "done" ? "border-[#00e5a0]/50" : chapter.state === "in-progress" ? "border-[#ffd966]/70" : "border-border/40 dark:border-[#2a2f47]/40"}`} />
                                        <span className={`relative flex size-20 items-center justify-center rounded-full border-[3px] text-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-shadow duration-200 group-hover:shadow-[0_0_32px_rgba(255,217,102,0.22)] ${chapter.state === "done" ? "border-[#00e5a0] bg-[linear-gradient(135deg,#003d28,#006644)] shadow-[0_0_24px_rgba(0,229,160,0.35)]" : chapter.state === "in-progress" ? "border-[#ffd966] bg-[linear-gradient(135deg,#2a2000,#4a3800)] shadow-[0_0_24px_rgba(255,217,102,0.3)] [animation:fa-node-bounce_3.4s_ease-in-out_infinite]" : "border-border dark:border-[#2a2f47] bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)] dark:bg-[linear-gradient(135deg,#161a2e,#1e2438)] opacity-80"}`}>
                                            {chapter.icon}
                                            {chapter.state === "done" && <span className="absolute bottom-0 right-0 flex size-[22px] items-center justify-center rounded-full border-2 border-background bg-[#00e5a0] text-[0.7rem] font-black text-black">✓</span>}
                                            <span className="absolute left-0 top-0 flex size-[22px] items-center justify-center rounded-full border-2 border-border dark:border-[#252a3f] bg-muted dark:bg-[#222846] text-[0.65rem] font-extrabold text-muted-foreground dark:text-[#7a82a0]">{index + 1}</span>
                                        </span>
                                    </button>

                                    <Link
                                        href={chapter.state === "locked" ? "#" : getSubmoduleHref(moduleSlug, chapter.slug)}
                                        aria-disabled={chapter.state === "locked"}
                                        onClick={(e) => {
                                            if (chapter.state === "locked") e.preventDefault();
                                        }}
                                        className={`relative flex-1 overflow-hidden rounded-[18px] border px-6 py-5 transition-all duration-200 ${rowRight ? "mr-3.5" : "ml-3.5"} ${chapter.state === "done" ? "border-[#00e5a0]/30 dark:border-[rgba(0,229,160,0.25)] bg-[#00e5a0]/5 dark:bg-[#161927] shadow-[0_0_20px_rgba(0,229,160,0.08)]" : chapter.state === "in-progress" ? "border-[#ffd966]/40 dark:border-[rgba(255,217,102,0.3)] bg-[#ffd966]/5 dark:bg-[#161927] shadow-[0_0_20px_rgba(255,217,102,0.08)]" : "border-border dark:border-[#252a3f] bg-muted/40 dark:bg-[#161927] opacity-70"} ${selected ? "ring-1 ring-ring/30 dark:ring-white/10" : ""}`}
                                    >
                                        <div className="mb-2 flex items-start justify-between gap-3">
                                            <div className="text-[1.02rem] font-extrabold leading-5 text-foreground dark:text-[#e8eaf0]">
                                                {chapter.title}
                                            </div>
                                            <div className="shrink-0 rounded-[10px] bg-foreground/5 dark:bg-white/5 px-2.5 py-0.5 text-[0.72rem] font-bold text-muted-foreground dark:text-[#7a82a0]">
                                                {chapter.task_count} task{chapter.task_count !== 1 ? "s" : ""}
                                            </div>
                                        </div>
                                        <div className="mb-2 flex items-center justify-between text-[0.72rem] text-muted-foreground dark:text-[#7a82a0]">
                                            <span>Progress</span>
                                            <span className={chapter.state === "done" ? "font-extrabold text-[#00c880] dark:text-[#00e5a0]" : chapter.state === "in-progress" ? "font-extrabold text-[#b8860b] dark:text-[#ffd966]" : "font-extrabold text-muted-foreground dark:text-[#4a5070]"}>{chapter.progress}%</span>
                                        </div>
                                        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-foreground/5 dark:bg-white/5">
                                            <div
                                                className={`h-full rounded-full ${chapter.state === "done" ? "bg-gradient-to-r from-[#00b87a] to-[#00e5a0]" : chapter.state === "in-progress" ? "bg-gradient-to-r from-[#c79b00] to-[#ffd966]" : "bg-muted dark:bg-[#2a2f47]"}`}
                                                style={{ width: `${chapter.state === "locked" ? 0 : chapter.state === "done" ? 100 : chapter.progress}%` }}
                                            />
                                        </div>
                                        <div className="mb-3 flex items-center gap-1.5 text-[0.7rem] font-extrabold">
                                            <span className={chapter.state === "locked" ? "rounded-lg bg-foreground/5 dark:bg-white/5 px-2 py-0.5 text-muted-foreground dark:text-[#4a5070]" : chapter.state === "done" ? "rounded-lg bg-[#00e5a0]/15 dark:bg-[rgba(0,229,160,0.12)] px-2 py-0.5 text-[#00c880] dark:text-[#00e5a0]" : "rounded-lg bg-[#ffd966]/20 dark:bg-[rgba(255,217,102,0.12)] px-2 py-0.5 text-[#b8860b] dark:text-[#ffd966]"}>
                                                {chapter.state === "locked" ? "Locked" : `+${chapter.xp} XP`}
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center gap-1 text-[0.78rem] font-extrabold text-[#b8860b] dark:text-[#ffd966]">
                                            {chapter.state === "done" ? "✓ Completed" : chapter.state === "locked" ? "🔒 Complete Previous Chapter" : "Continue Learning"}
                                            <ChevronRight className="size-3" />
                                        </div>
                                    </Link>
                                </div>

                                {index < chapterItems.length - 1 && (
                                    <div className="relative h-14 overflow-hidden">
                                        <div className={`absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 ${chapter.state === "done" ? "bg-[repeating-linear-gradient(to_bottom,#00b87a_0,#00b87a_6px,transparent_6px,transparent_14px)]" : "bg-[repeating-linear-gradient(to_bottom,var(--border)_0,var(--border)_6px,transparent_6px,transparent_14px)] dark:bg-[repeating-linear-gradient(to_bottom,#2a3060_0,#2a3060_6px,transparent_6px,transparent_14px)]"}`} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {isOpen && activeChapter && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-[rgba(5,7,18,0.82)] px-6 backdrop-blur-sm">
                        <div className="relative w-full max-w-md rounded-[24px] border border-border dark:border-[#252a3f] bg-card dark:bg-[#161927] p-7 shadow-2xl">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute right-5 top-4 text-2xl leading-none text-muted-foreground dark:text-[#7a82a0] transition-colors hover:text-foreground dark:hover:text-white"
                                aria-label="Close"
                            >
                                <X className="size-5" />
                            </button>

                            <div className="mb-3 text-center text-5xl">{activeChapter.icon}</div>
                            <div className="mb-1 text-center font-[family-name:var(--font-geist-sans)] text-[1.4rem] font-extrabold text-foreground">
                                {activeChapter.title}
                            </div>
                            <div className="mb-5 text-center text-sm text-muted-foreground dark:text-[#7a82a0]">
                                Chapter {activeIndex + 1} of {chapterItems.length}
                            </div>

                            <div className="mb-5 grid grid-cols-3 gap-3">
                                <div className="rounded-2xl border border-border dark:border-[#252a3f] bg-muted/50 dark:bg-white/5 p-3 text-center">
                                    <div className="text-2xl font-black text-foreground">{activeChapter.task_count}</div>
                                    <div className="mt-1 text-[0.7rem] text-muted-foreground dark:text-[#7a82a0]">Tasks</div>
                                </div>
                                <div className="rounded-2xl border border-border dark:border-[#252a3f] bg-muted/50 dark:bg-white/5 p-3 text-center">
                                    <div className="text-2xl font-black text-foreground">{activeChapter.progress}%</div>
                                    <div className="mt-1 text-[0.7rem] text-muted-foreground dark:text-[#7a82a0]">Progress</div>
                                </div>
                                <div className="rounded-2xl border border-border dark:border-[#252a3f] bg-muted/50 dark:bg-white/5 p-3 text-center">
                                    <div className="text-2xl font-black text-foreground">+{activeChapter.xp}</div>
                                    <div className="mt-1 text-[0.7rem] text-muted-foreground dark:text-[#7a82a0]">XP</div>
                                </div>
                            </div>

                            <div className="mb-2 flex items-center justify-between text-[0.78rem] text-muted-foreground dark:text-[#7a82a0]">
                                <span>Progress</span>
                                <span className="text-foreground">{activeChapter.progress}%</span>
                            </div>
                            <div className="mb-5 h-2 overflow-hidden rounded-full bg-muted dark:bg-white/5">
                                <div
                                    className={`h-full rounded-full ${isDone ? "bg-[#00e5a0]" : isLocked ? "bg-muted dark:bg-[#2a2f47]" : "bg-[#ffd966]"}`}
                                    style={{ width: `${isLocked ? 0 : Math.max(activeChapter.progress, isDone ? 100 : 20)}%` }}
                                />
                            </div>

                            <Link
                                href={isLocked ? "#" : getSubmoduleHref(moduleSlug, activeChapter.slug)}
                                onClick={(e) => {
                                    if (isLocked) e.preventDefault();
                                }}
                                className={`block w-full rounded-2xl px-4 py-3 text-center text-base font-extrabold transition-transform hover:translate-y-[-2px] ${isDone ? "bg-gradient-to-r from-[#00b87a] to-[#00e5a0] text-[#002a1a]" : isLocked ? "bg-muted dark:bg-[#2a2f47] text-muted-foreground dark:text-[#4a5070]" : "bg-gradient-to-r from-[#c79b00] to-[#ffd966] text-[#1a1000]"}`}
                            >
                                {isDone ? "✓ Review Chapter" : isLocked ? "🔒 Complete Previous Chapter" : "Go to Chapter"}
                            </Link>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
