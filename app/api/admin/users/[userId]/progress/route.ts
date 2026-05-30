import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getUserCourseAccess } from "@/lib/supabase/admin-auth";

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

        let questionsQuery = supabaseAdmin
            .from("questions")
            .select("id, type, chapter_id")
            .eq("is_active", true);

        if (chapterId) {
            questionsQuery = questionsQuery.eq("chapter_id", chapterId);
        } else {
            const { data: chapters } = await supabaseAdmin
                .from("chapters")
                .select("id")
                .eq("course_id", courseId);
            const chapterIds = chapters?.map((c) => c.id) || [];
            if (chapterIds.length > 0) {
                questionsQuery = questionsQuery.in("chapter_id", chapterIds);
            } else {
                return NextResponse.json({
                    attempted: 0,
                    completed: 0,
                    remaining: 0,
                    total: 0,
                    progress: 0,
                    courseProgress: 0,
                });
            }
        }

        const { data: questions } = await questionsQuery;

        const questionIds = (questions ?? []).map((q) => q.id);
        const total = questionIds.length;

        if (total === 0) {
            return NextResponse.json({
                attempted: 0,
                completed: 0,
                remaining: 0,
                total: 0,
                progress: 0,
                courseProgress: 0,
            });
        }

        const { data: attempts } = await supabaseAdmin
            .from("user_question_attempts")
            .select("id, question_id, is_correct")
            .eq("user_id", userId)
            .in("question_id", questionIds);

        const { data: completions } = await supabaseAdmin
            .from("user_question_completions")
            .select("id, question_id")
            .eq("user_id", userId)
            .in("question_id", questionIds);

        const attemptedQuestionIds = new Set(
            (attempts ?? []).map((a) => a.question_id),
        );
        const completedQuestionIds = new Set(
            (completions ?? []).map((c) => c.question_id),
        );

        let attempted = 0;
        let completed = 0;

        for (const q of questions ?? []) {
            if (q.type === "question") {
                if (attemptedQuestionIds.has(q.id)) {
                    attempted++;
                }
            } else {
                if (completedQuestionIds.has(q.id)) {
                    completed++;
                }
            }
        }

        const remaining = total - attempted - completed;
        const progress =
            total > 0 ? Math.round(((attempted + completed) / total) * 100) : 0;

        let courseAttempted = 0;
        let courseCompleted = 0;
        let courseTotal = 0;

        if (!chapterId) {
            const { data: courseChapters } = await supabaseAdmin
                .from("chapters")
                .select("id")
                .eq("course_id", courseId);
            const courseChapterIds = courseChapters?.map((c) => c.id) || [];

            if (courseChapterIds.length > 0) {
                const { data: courseQuestions } = await supabaseAdmin
                    .from("questions")
                    .select("id, type")
                    .eq("is_active", true)
                    .in("chapter_id", courseChapterIds);

                courseTotal = (courseQuestions ?? []).length;

                if (courseTotal > 0) {
                    const { data: allAttempts } = await supabaseAdmin
                        .from("user_question_attempts")
                        .select("id, question_id")
                        .eq("user_id", userId)
                        .in("question_id", (courseQuestions ?? []).map((q) => q.id));

                    const { data: allCompletions } = await supabaseAdmin
                        .from("user_question_completions")
                        .select("id, question_id")
                        .eq("user_id", userId)
                        .in("question_id", (courseQuestions ?? []).map((q) => q.id));

                    const allAttemptedIds = new Set(
                        (allAttempts ?? []).map((a) => a.question_id),
                    );
                    const allCompletedIds = new Set(
                        (allCompletions ?? []).map((c) => c.question_id),
                    );

                    for (const q of courseQuestions ?? []) {
                        if (q.type === "question") {
                            if (allAttemptedIds.has(q.id)) {
                                courseAttempted++;
                            }
                        } else {
                            if (allCompletedIds.has(q.id)) {
                                courseCompleted++;
                            }
                        }
                    }
                }
            }
        }

        const courseProgress =
            courseTotal > 0
                ? Math.round(
                      ((courseAttempted + courseCompleted) / courseTotal) * 100,
                  )
                : 0;

        return NextResponse.json({
            attempted,
            completed,
            remaining,
            total,
            progress,
            courseProgress,
            courseAttempted,
            courseCompleted,
            courseTotal,
        });
    } catch (error) {
        console.error("User progress fetch error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}