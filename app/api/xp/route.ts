import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const PER_PAGE = 20;

function getOrdinal(n: number): string {
    if (n === 1) return "1st";
    if (n === 2) return "2nd";
    if (n === 3) return "3rd";
    return `${n}th`;
}

interface XPPaginatedSection {
    entries: Record<string, unknown>[];
    pagination: {
        total: number;
        page: number;
        perPage: number;
        hasMore: boolean;
    };
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
        const offset = (page - 1) * PER_PAGE;

        const supabase = await createClient();
        const supabaseAdmin = createAdminClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: xpData } = await supabaseAdmin
            .from("user_xp")
            .select("total_xp")
            .eq("user_id", user.id)
            .maybeSingle();

        const { count: taskCount } = await supabaseAdmin
            .from("user_task_xp_events")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

        const { data: taskXPData } = await supabaseAdmin
            .from("user_task_xp_events")
            .select(`
                id,
                topic_number,
                attempt_number,
                xp_earned,
                created_at,
                chapters!inner(id, title)
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .range(offset, offset + PER_PAGE - 1);

        const taskEntries = (taskXPData ?? []).map((event: Record<string, unknown>) => {
            const chapters = event.chapters as Record<string, unknown>;
            return {
                chapterTitle: chapters.title as string,
                topicNumber: event.topic_number as number,
                attemptOrdinal: getOrdinal(event.attempt_number as number),
                xp: event.xp_earned as number,
                earnedAt: event.created_at as string,
            };
        });

        const { count: contentCount } = await supabaseAdmin
            .from("user_content_xp_events")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

        const { data: contentXPData } = await supabaseAdmin
            .from("user_content_xp_events")
            .select(`
                id,
                topic_number,
                xp_earned,
                earned_at,
                chapters!inner(id, title)
            `)
            .eq("user_id", user.id)
            .order("earned_at", { ascending: false })
            .range(offset, offset + PER_PAGE - 1);

        const contentEntries = (contentXPData ?? []).map((event: Record<string, unknown>) => {
            const chapters = event.chapters as Record<string, unknown>;
            return {
                chapterTitle: chapters.title as string,
                topicNumber: event.topic_number as number,
                xp: event.xp_earned as number,
                earnedAt: event.earned_at as string,
            };
        });

        const { count: achievementCount } = await supabaseAdmin
            .from("user_achievements")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);

        const { data: achievementsData } = await supabaseAdmin
            .from("user_achievements")
            .select("*")
            .eq("user_id", user.id)
            .order("awarded_at", { ascending: false })
            .range(offset, offset + PER_PAGE - 1);

        const ACHIEVEMENT_TITLES: Record<string, string> = {
            first_try_ace: "First Try Ace",
            quick_mastery: "Quick Mastery",
            accuracy_builder: "Accuracy Builder",
            practice_streak: "Practice Streak",
            comeback_scholar: "Comeback Scholar",
            chapter_closer: "Chapter Closer",
            accounting_explorer: "Accounting Explorer",
            ledger_starter: "Ledger Starter",
            trial_balance_tracker: "Trial Balance Tracker",
            statement_builder: "Statement Builder",
            accounting_master: "Accounting Master",
        };

        const achievementEntries = (achievementsData ?? []).map((event: Record<string, unknown>) => ({
            achievementKey: event.achievement_key as string,
            achievementTitle: ACHIEVEMENT_TITLES[event.achievement_key as string] ?? event.achievement_key as string,
            xp: event.xp_awarded as number,
            earnedAt: event.awarded_at as string,
        }));

        const taskXP: XPPaginatedSection = {
            entries: taskEntries,
            pagination: {
                total: taskCount ?? 0,
                page,
                perPage: PER_PAGE,
                hasMore: (taskCount ?? 0) > offset + PER_PAGE,
            },
        };

        const contentXP: XPPaginatedSection = {
            entries: contentEntries,
            pagination: {
                total: contentCount ?? 0,
                page,
                perPage: PER_PAGE,
                hasMore: (contentCount ?? 0) > offset + PER_PAGE,
            },
        };

        const achievementXP: XPPaginatedSection = {
            entries: achievementEntries,
            pagination: {
                total: achievementCount ?? 0,
                page,
                perPage: PER_PAGE,
                hasMore: (achievementCount ?? 0) > offset + PER_PAGE,
            },
        };

        return NextResponse.json({
            totalXP: xpData?.total_xp ?? 0,
            achievementsUnlocked: achievementCount ?? 0,
            taskXP,
            contentXP,
            achievementXP,
        });
    } catch (error) {
        console.error("Failed to fetch XP and achievements", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}