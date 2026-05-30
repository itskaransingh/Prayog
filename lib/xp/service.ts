import { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    XP_BY_ATTEMPT,
    CHAPTER_COMPLETION_BONUS_XP,
    type UserAchievement,
} from "./types";

export interface AchievementDefinition {
    key: string;
    xp: number;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
    { key: "first_try_ace", xp: 25 },
    { key: "quick_mastery", xp: 25 },
    { key: "accuracy_builder", xp: 40 },
    { key: "practice_streak", xp: 30 },
    { key: "comeback_scholar", xp: 25 },
    { key: "chapter_closer", xp: 30 },
    { key: "accounting_explorer", xp: 50 },
    { key: "ledger_starter", xp: 25 },
    { key: "trial_balance_tracker", xp: 30 },
    { key: "statement_builder", xp: 35 },
    { key: "accounting_master", xp: 100 },
];

export function getXPForAttempt(attemptNumber: number): number {
    if (attemptNumber <= 0) return XP_BY_ATTEMPT[XP_BY_ATTEMPT.length - 1];
    return XP_BY_ATTEMPT[Math.min(attemptNumber - 1, XP_BY_ATTEMPT.length - 1)];
}

export async function upsertUserXP(
    supabaseAdmin: SupabaseClient,
    userId: string,
    xpToAdd: number,
): Promise<number> {
    const { data: existing } = await supabaseAdmin
        .from("user_xp")
        .select("total_xp")
        .eq("user_id", userId)
        .maybeSingle();

    const newTotal = (existing?.total_xp ?? 0) + xpToAdd;

    await supabaseAdmin.from("user_xp").upsert(
        { user_id: userId, total_xp: newTotal, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
    );

    return newTotal;
}

export async function recordTaskXPEvent(
    supabaseAdmin: SupabaseClient,
    userId: string,
    questionId: string,
    chapterId: string,
    topicNumber: number,
    attemptNumber: number,
    xpEarned: number,
): Promise<void> {
    await supabaseAdmin.from("user_task_xp_events").insert({
        user_id: userId,
        question_id: questionId,
        chapter_id: chapterId,
        topic_number: topicNumber,
        attempt_number: attemptNumber,
        xp_earned: xpEarned,
    });
}

export async function recordContentXPEvent(
    supabaseAdmin: SupabaseClient,
    userId: string,
    questionId: string,
    chapterId: string,
    topicNumber: number,
    xpEarned: number,
): Promise<void> {
    await supabaseAdmin.from("user_content_xp_events").insert({
        user_id: userId,
        question_id: questionId,
        chapter_id: chapterId,
        topic_number: topicNumber,
        xp_earned: xpEarned,
        earned_at: new Date().toISOString(),
    });
}

export async function awardAchievement(
    supabaseAdmin: SupabaseClient,
    userId: string,
    achievementKey: string,
    xpAwarded: number,
): Promise<boolean> {
    const { data: existing } = await supabaseAdmin
        .from("user_achievements")
        .select("id")
        .eq("user_id", userId)
        .eq("achievement_key", achievementKey)
        .maybeSingle();

    if (existing) return false;

    const { error } = await supabaseAdmin.from("user_achievements").insert({
        user_id: userId,
        achievement_key: achievementKey,
        xp_awarded: xpAwarded,
        awarded_at: new Date().toISOString(),
    });

    if (error) {
        console.error(`Failed to award achievement ${achievementKey}:`, error);
        return false;
    }

    await upsertUserXP(supabaseAdmin, userId, xpAwarded);
    return true;
}

export async function getAttemptCountForQuestion(
    supabaseAdmin: SupabaseClient,
    userId: string,
    questionId: string,
): Promise<number> {
    const { count } = await supabaseAdmin
        .from("user_question_attempts")
        .select("*", { count: "exact", head: true })
        .eq("question_id", questionId);

    return count ?? 0;
}

export async function getUserAchievements(
    supabaseAdmin: SupabaseClient,
    userId: string,
): Promise<UserAchievement[]> {
    const { data } = await supabaseAdmin
        .from("user_achievements")
        .select("*")
        .eq("user_id", userId)
        .order("awarded_at", { ascending: false });

    return data ?? [];
}

export async function getLeaderboard(limit = 20): Promise<
    Array<{ rank: number; user_id: string; name: string; initials: string; total_xp: number }>
> {
    const supabaseAdmin = createAdminClient();

    const { data } = await supabaseAdmin
        .from("user_xp")
        .select("user_id, total_xp")
        .order("total_xp", { ascending: false })
        .limit(limit);

    if (!data || data.length === 0) return [];

    return data.map((row, index) => ({
        rank: index + 1,
        user_id: row.user_id,
        name: "",
        initials: "",
        total_xp: row.total_xp,
    }));
}

export async function checkAndAwardAchievements(
    supabaseAdmin: SupabaseClient,
    userId: string,
    context: {
        questionId: string;
        attemptNumber: number;
        accuracy: number;
        isFirstCompletion: boolean;
        chapterId: string;
        simulatorType: string | null;
    },
): Promise<string[]> {
    const awarded: string[] = [];

    if (context.attemptNumber === 1 && context.accuracy === 100) {
        const success = await awardAchievement(supabaseAdmin, userId, "first_try_ace", 25);
        if (success) awarded.push("first_try_ace");
    }

    if (context.attemptNumber === 2 && context.accuracy === 100) {
        const success = await awardAchievement(supabaseAdmin, userId, "quick_mastery", 25);
        if (success) awarded.push("quick_mastery");
    }

    if (context.accuracy >= 80) {
        const recentAttempts = await supabaseAdmin
            .from("user_question_attempts")
            .select("id, question_id, is_correct")
            .eq("question_id", context.questionId)
            .order("id", { ascending: false })
            .limit(5);

        const questionIds = [...new Set((recentAttempts.data ?? []).map((a) => a.question_id))];
        if (questionIds.length >= 5) {
            const allCorrect = questionIds.every((qId) =>
                (recentAttempts.data ?? []).filter((a) => a.question_id === qId)[0]?.is_correct
            );
            if (allCorrect) {
                const success = await awardAchievement(supabaseAdmin, userId, "accuracy_builder", 40);
                if (success) awarded.push("accuracy_builder");
            }
        }
    }

    if (context.isFirstCompletion && context.accuracy < 100) {
        const success = await awardAchievement(supabaseAdmin, userId, "comeback_scholar", 25);
        if (success) awarded.push("comeback_scholar");
    }

    if (context.simulatorType === "ledger") {
        const success = await awardAchievement(supabaseAdmin, userId, "ledger_starter", 25);
        if (success) awarded.push("ledger_starter");
    }

    if (context.simulatorType === "trial_balance") {
        const success = await awardAchievement(supabaseAdmin, userId, "trial_balance_tracker", 30);
        if (success) awarded.push("trial_balance_tracker");
    }

    if (context.simulatorType === "financial_statement") {
        const success = await awardAchievement(supabaseAdmin, userId, "statement_builder", 35);
        if (success) awarded.push("statement_builder");
    }

    return awarded;
}

export async function checkChapterCompletion(
    supabaseAdmin: SupabaseClient,
    userId: string,
    chapterId: string,
    courseId: string,
): Promise<{ completed: boolean; xpAwarded: number }> {
    const { data: questions } = await supabaseAdmin
        .from("questions")
        .select("id, type")
        .eq("chapter_id", chapterId)
        .eq("is_active", true);

    if (!questions || questions.length === 0) return { completed: false, xpAwarded: 0 };

    const questionIds = questions.map((q) => q.id);
    const questionTypes = questions.map((q) => q.type);

    const { data: completions } = await supabaseAdmin
        .from("user_question_completions")
        .select("question_id")
        .eq("user_id", userId)
        .in("question_id", questionIds);

    const { data: attempts } = await supabaseAdmin
        .from("user_question_attempts")
        .select("question_id")
        .in("question_id", questionIds);

    const completedSet = new Set((completions ?? []).map((c) => c.question_id));
    const attemptedSet = new Set((attempts ?? []).map((a) => a.question_id));

    const allCompleted = questionIds.every((qId, i) => {
        if (questionTypes[i] === "question") {
            return attemptedSet.has(qId);
        }
        return completedSet.has(qId);
    });

    if (!allCompleted) return { completed: false, xpAwarded: 0 };

    const alreadyAwarded = await supabaseAdmin
        .from("user_achievements")
        .select("id")
        .eq("user_id", userId)
        .eq("achievement_key", `chapter_closer_${chapterId}`)
        .maybeSingle();

    if (alreadyAwarded) return { completed: false, xpAwarded: 0 };

    await supabaseAdmin.from("user_achievements").insert({
        user_id: userId,
        achievement_key: `chapter_closer_${chapterId}`,
        xp_awarded: CHAPTER_COMPLETION_BONUS_XP,
        awarded_at: new Date().toISOString(),
    });

    await upsertUserXP(supabaseAdmin, userId, CHAPTER_COMPLETION_BONUS_XP);
    await awardAchievement(supabaseAdmin, userId, "chapter_closer", 30);

    return { completed: true, xpAwarded: CHAPTER_COMPLETION_BONUS_XP };
}

export async function checkAccountingExplorer(
    supabaseAdmin: SupabaseClient,
    userId: string,
    courseId: string,
): Promise<boolean> {
    const { data: chapters } = await supabaseAdmin
        .from("chapters")
        .select("id")
        .eq("course_id", courseId)
        .eq("is_active", true);

    if (!chapters || chapters.length === 0) return false;

    const chapterIds = chapters.map((c) => c.id);

    const { data: questions } = await supabaseAdmin
        .from("questions")
        .select("id, chapter_id, type")
        .in("chapter_id", chapterIds)
        .eq("is_active", true);

    if (!questions || questions.length === 0) return false;

    const chaptersWithProgress = new Set<string>();

    for (const q of questions) {
        if (q.type === "question") {
            const { data: attempt } = await supabaseAdmin
                .from("user_question_attempts")
                .select("id")
                .eq("question_id", q.id)
                .maybeSingle();
            if (attempt) chaptersWithProgress.add(q.chapter_id);
        } else {
            const { data: completion } = await supabaseAdmin
                .from("user_question_completions")
                .select("id")
                .eq("question_id", q.id)
                .maybeSingle();
            if (completion) chaptersWithProgress.add(q.chapter_id);
        }
    }

    if (chaptersWithProgress.size >= chapterIds.length) {
        return await awardAchievement(supabaseAdmin, userId, "accounting_explorer", 50);
    }

    return false;
}

export async function checkAccountingMaster(
    supabaseAdmin: SupabaseClient,
    userId: string,
    courseId: string,
): Promise<boolean> {
    const { data: chapters } = await supabaseAdmin
        .from("chapters")
        .select("id")
        .eq("course_id", courseId)
        .eq("is_active", true);

    if (!chapters || chapters.length === 0) return false;

    const chapterIds = chapters.map((c) => c.id);

    const { data: questions } = await supabaseAdmin
        .from("questions")
        .select("id, chapter_id, type")
        .in("chapter_id", chapterIds)
        .eq("is_active", true);

    if (!questions || questions.length === 0) return false;

    const notCompleted: string[] = [];

    for (const q of questions) {
        if (q.type === "question") {
            const { data: attempt } = await supabaseAdmin
                .from("user_question_attempts")
                .select("id")
                .eq("question_id", q.id)
                .maybeSingle();
            if (!attempt) notCompleted.push(q.id);
        } else {
            const { data: completion } = await supabaseAdmin
                .from("user_question_completions")
                .select("id")
                .eq("question_id", q.id)
                .maybeSingle();
            if (!completion) notCompleted.push(q.id);
        }
    }

    if (notCompleted.length === 0) {
        return await awardAchievement(supabaseAdmin, userId, "accounting_master", 100);
    }

    return false;
}