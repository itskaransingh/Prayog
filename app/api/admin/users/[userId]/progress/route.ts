import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getUserCourseAccess } from "@/lib/supabase/admin-auth";

type ProgressSnapshot = {
    attempted: number;
    completed: number;
    remaining: number;
    total: number;
    progress: number;
};

function buildProgressSnapshot(
    questions: { id: string; type: string | null; chapter_id: string }[],
    attemptedIds: Set<string>,
    completedIds: Set<string>,
): ProgressSnapshot {
    const total = questions.length;
    let attempted = 0;
    let completed = 0;

    for (const question of questions) {
        if (question.type === "question") {
            if (attemptedIds.has(question.id)) {
                attempted++;
            }
        } else if (completedIds.has(question.id)) {
            completed++;
        }
    }

    const remaining = Math.max(total - completed, 0);
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { attempted, completed, remaining, total, progress };
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;

        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options),
                            );
                        } catch {
                            // Ignored in route handlers.
                        }
                    },
                },
            },
        );

        const {
            data: { user: requester },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !requester) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", requester.id)
            .single();

        if (
            profileError ||
            !profile ||
            (profile.role !== "super_admin" &&
                profile.role !== "admin" &&
                profile.role !== "faculty")
        ) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const url = new URL(request.url);
        const courseId = url.searchParams.get("courseId");
        const chapterId = url.searchParams.get("chapterId");

        if (!courseId) {
            return NextResponse.json(
                { error: "courseId query param is required" },
                { status: 400 },
            );
        }

        const supabaseAdmin = createAdminClient();

        if (profile.role === "faculty") {
            const accessibleCourseIds = await getUserCourseAccess(supabase, requester.id);
            if (!accessibleCourseIds.includes(courseId)) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const { data: courseChapters } = await supabaseAdmin
            .from("chapters")
            .select("id")
            .eq("course_id", courseId);

        const chapterIds = (courseChapters ?? []).map((c) => c.id);
        if (chapterIds.length === 0) {
            return NextResponse.json({
                attempted: 0,
                completed: 0,
                remaining: 0,
                total: 0,
                progress: 0,
                courseAttempted: 0,
                courseCompleted: 0,
                courseRemaining: 0,
                courseTotal: 0,
                courseProgress: 0,
            });
        }

        const { data: courseQuestions } = await supabaseAdmin
            .from("questions")
            .select("id, type, chapter_id")
            .in("chapter_id", chapterIds);

        const courseQuestionIds = (courseQuestions ?? []).map((q) => q.id);
        if (courseQuestionIds.length === 0) {
            return NextResponse.json({
                attempted: 0,
                completed: 0,
                remaining: 0,
                total: 0,
                progress: 0,
                courseAttempted: 0,
                courseCompleted: 0,
                courseRemaining: 0,
                courseTotal: 0,
                courseProgress: 0,
            });
        }

        const { data: attempts } = await supabaseAdmin
            .from("user_question_attempts")
            .select("question_id, user_simulation_attempts!attempt_id!inner(user_id)")
            .eq("user_simulation_attempts.user_id", userId)
            .in("question_id", courseQuestionIds);

        const { data: completions } = await supabaseAdmin
            .from("user_question_completions")
            .select("id, question_id")
            .eq("user_id", userId)
            .in("question_id", courseQuestionIds);

        const attemptedQuestionIds = new Set((attempts ?? []).map((a) => a.question_id));
        const completedQuestionIds = new Set((completions ?? []).map((c) => c.question_id));

        const courseSnapshot = buildProgressSnapshot(
            courseQuestions ?? [],
            attemptedQuestionIds,
            completedQuestionIds,
        );

        const chapterQuestions = chapterId
            ? (courseQuestions ?? []).filter((question) => question.chapter_id === chapterId)
            : (courseQuestions ?? []);

        const chapterSnapshot = chapterId
            ? buildProgressSnapshot(chapterQuestions, attemptedQuestionIds, completedQuestionIds)
            : courseSnapshot;

        return NextResponse.json({
            attempted: chapterSnapshot.attempted,
            completed: chapterSnapshot.completed,
            remaining: chapterSnapshot.remaining,
            total: chapterSnapshot.total,
            progress: chapterSnapshot.progress,
            courseAttempted: courseSnapshot.attempted,
            courseCompleted: courseSnapshot.completed,
            courseRemaining: courseSnapshot.remaining,
            courseTotal: courseSnapshot.total,
            courseProgress: courseSnapshot.progress,
        });
    } catch (error) {
        console.error("User progress fetch error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
