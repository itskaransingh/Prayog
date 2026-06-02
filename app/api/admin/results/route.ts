import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

type JoinedAttemptRow = {
    id: string;
    question_id: string;
    is_correct: boolean;
    created_at: string;
    user_simulation_attempts: {
        id: string;
        user_id: string;
        task_id: string;
        total_score: number;
        max_possible_score: number;
        accuracy: number;
        created_at: string;
        simulation_tasks: {
            id: string;
            title: string | null;
            question_id: string;
            questions: {
                id: string;
                title: string | null;
                chapter_id: string;
                chapters: {
                    id: string;
                    title: string | null;
                    course_id: string;
                    sort_order: number | null;
                    courses: {
                        id: string;
                        title: string | null;
                    } | null;
                } | null;
            } | null;
        } | null;
    } | null;
};

type AnalyticsChapterRow = {
    id: string;
    title: string | null;
    course_id: string;
    sort_order: number | null;
    courses: {
        id: string;
        title: string | null;
    } | null;
};

type AnalyticsQuestionRow = {
    id: string;
    chapter_id: string;
};

type AnalyticsCompletionRow = {
    question_id: string;
    user_id: string;
};

function deriveFullName(email: string | null | undefined) {
    if (!email) {
        return "Unknown User";
    }

    return email.split("@")[0]?.trim() || email;
}

function getFirst<T>(value: T | T[] | null | undefined): T | null {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }

    return value ?? null;
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function toPercent(score: number, maxPossible: number) {
    return maxPossible > 0 ? (score / maxPossible) * 100 : 0;
}

function buildLinearRegression(points: Array<{ x: number; y: number }>) {
    if (points.length < 2) {
        return points.map((point) => ({ ...point, trendY: point.y }));
    }

    const n = points.length;
    const sumX = points.reduce((sum, point) => sum + point.x, 0);
    const sumY = points.reduce((sum, point) => sum + point.y, 0);
    const sumXY = points.reduce((sum, point) => sum + point.x * point.y, 0);
    const sumXX = points.reduce((sum, point) => sum + point.x * point.x, 0);
    const denominator = n * sumXX - sumX * sumX;
    const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    return points.map((point) => ({
        ...point,
        trendY: slope * point.x + intercept,
    }));
}

function buildHistogram(values: number[]) {
    if (values.length === 0) {
        return [];
    }

    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min === max) {
        return [{ label: `${min.toFixed(0)}`, count: values.length }];
    }

    const bucketCount = Math.min(8, Math.max(4, Math.ceil(Math.sqrt(values.length))));
    const step = (max - min) / bucketCount;
    const buckets = Array.from({ length: bucketCount }, (_, index) => ({
        start: min + step * index,
        end: index === bucketCount - 1 ? max : min + step * (index + 1),
        count: 0,
    }));

    for (const value of values) {
        const index = clamp(Math.floor((value - min) / step), 0, bucketCount - 1);
        buckets[index].count += 1;
    }

    return buckets.map((bucket) => ({
        label: `${bucket.start.toFixed(0)}-${bucket.end.toFixed(0)}`,
        count: bucket.count,
    }));
}

export async function GET(request: Request) {
    try {
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
        const selectedCourseId = url.searchParams.get("courseId");
        const selectedChapterId = url.searchParams.get("chapterId");
        const selectedUserId = url.searchParams.get("userId");
        const mode = selectedChapterId ? "chapter" : "course";

        const supabaseAdmin = createAdminClient();
        const selectQuery = `
            id,
            question_id,
            is_correct,
            created_at,
            user_simulation_attempts!attempt_id (
                id,
                user_id,
                task_id,
                total_score,
                max_possible_score,
                accuracy,
                created_at,
                simulation_tasks!task_id (
                    id,
                    title,
                    question_id,
                    questions!question_id (
                        id,
                        title,
                        chapter_id,
                        chapters!chapter_id (
                            id,
                            title,
                            course_id,
                            sort_order,
                            courses!course_id (
                                id,
                                title
                            )
                        )
                    )
                )
            )
        `;

        const { data: joinedAttempts, error: fetchError } = await supabaseAdmin
            .from("user_question_attempts")
            .select(selectQuery)
            .order("created_at", { ascending: true });

        if (fetchError) {
            return NextResponse.json(
                {
                    error: fetchError.message,
                    details: fetchError.details,
                    hint: fetchError.hint,
                    code: fetchError.code,
                },
                { status: 500 },
            );
        }

        const totalJoinedAttempts = joinedAttempts?.length ?? 0;

        const userIds = Array.from(
            new Set(
                (joinedAttempts ?? [])
                    .map((attempt) => getFirst(attempt.user_simulation_attempts)?.user_id)
                    .filter((userId): userId is string => Boolean(userId)),
            ),
        );

        const profileMap: Record<string, { email: string; full_name: string }> = {};
        if (userIds.length > 0) {
            const { data: profiles } = await supabaseAdmin
                .from("profiles")
                .select("id, email, full_name")
                .in("id", userIds);

            (profiles ?? []).forEach((item) => {
                const email = item.email || "Unknown";
                profileMap[item.id] = {
                    email,
                    full_name: item.full_name?.trim() || deriveFullName(item.email),
                };
            });
        }

        const normalizedAttempts = ((joinedAttempts ?? []) as unknown as JoinedAttemptRow[])
            .map((attempt) => {
                const simulationAttempt = getFirst(attempt.user_simulation_attempts);
                const simulationTask = getFirst(simulationAttempt?.simulation_tasks);
                const question = getFirst(simulationTask?.questions);
                const chapter = getFirst(question?.chapters);
                const courseRecord = getFirst(chapter?.courses);

                if (!simulationAttempt || !question || !chapter) {
                    return null;
                }

                return {
                    full_name:
                        profileMap[simulationAttempt.user_id]?.full_name || "Unknown User",
                    question_attempt_id: attempt.id,
                    attempt_id: simulationAttempt.id,
                    user_id: simulationAttempt.user_id,
                    email: profileMap[simulationAttempt.user_id]?.email || "Unknown",
                    course_id: courseRecord?.id || "",
                    course_name: courseRecord?.title || "Unknown",
                    chapter_id: chapter.id,
                    chapter_name: chapter.title || "Unknown",
                    chapter_sort_order: chapter.sort_order ?? Number.MAX_SAFE_INTEGER,
                    question_id: question.id,
                    question_title: question.title || "Untitled Question",
                    task_id: simulationAttempt.task_id,
                    task_title: simulationTask?.title || "Untitled Task",
                    total_score: simulationAttempt.total_score,
                    max_possible_score: simulationAttempt.max_possible_score,
                    accuracy: simulationAttempt.accuracy,
                    is_correct: attempt.is_correct,
                    created_at: simulationAttempt.created_at || attempt.created_at,
                    question_attempt_created_at: attempt.created_at,
                };
            })
            .filter((attempt): attempt is NonNullable<typeof attempt> => Boolean(attempt))
            .filter((attempt) => {
                if (selectedCourseId && attempt.course_id !== selectedCourseId) {
                    return false;
                }

                if (selectedChapterId && attempt.chapter_id !== selectedChapterId) {
                    return false;
                }

                if (selectedUserId && attempt.user_id !== selectedUserId) {
                    return false;
                }

                return true;
            });

        const attemptCounters = new Map<string, number>();
        const flatAttempts = normalizedAttempts.map((attempt) => {
            const counterKey = `${attempt.user_id}:${attempt.question_id}`;
            const nextAttemptNumber = (attemptCounters.get(counterKey) ?? 0) + 1;
            attemptCounters.set(counterKey, nextAttemptNumber);

            return {
                ...attempt,
                attempt_number: nextAttemptNumber,
            };
        });

        const groupedByChapter = Array.from(
            flatAttempts.reduce((chapterMap, attempt) => {
                const chapterKey = attempt.chapter_id;
                const existingChapter = chapterMap.get(chapterKey) ?? {
                    course_id: attempt.course_id,
                    course_name: attempt.course_name,
                    chapter_id: attempt.chapter_id,
                    chapter_name: attempt.chapter_name,
                    users: new Map<
                        string,
                        {
                            user_id: string;
                            full_name: string;
                            email: string;
                            questions: Map<
                                string,
                                {
                                    question_id: string;
                                    question_title: string;
                                    attempt_count: number;
                                    attempts: typeof flatAttempts;
                                }
                            >;
                        }
                    >(),
                };

                const existingUser = existingChapter.users.get(attempt.user_id) ?? {
                    user_id: attempt.user_id,
                    full_name: attempt.full_name,
                    email: attempt.email,
                    questions: new Map(),
                };

                const existingQuestion = existingUser.questions.get(attempt.question_id) ?? {
                    question_id: attempt.question_id,
                    question_title: attempt.question_title,
                    attempt_count: 0,
                    attempts: [],
                };

                existingQuestion.attempts.push(attempt);
                existingQuestion.attempt_count = existingQuestion.attempts.length;
                existingUser.questions.set(attempt.question_id, existingQuestion);
                existingChapter.users.set(attempt.user_id, existingUser);
                chapterMap.set(chapterKey, existingChapter);
                return chapterMap;
            }, new Map<string, {
                course_id: string;
                course_name: string;
                chapter_id: string;
                chapter_name: string;
                users: Map<string, {
                    user_id: string;
                    full_name: string;
                    email: string;
                    questions: Map<string, {
                        question_id: string;
                        question_title: string;
                        attempt_count: number;
                        attempts: typeof flatAttempts;
                    }>;
                }>;
            }>())
                .values(),
        ).map((chapter) => ({
            course_id: chapter.course_id,
            course_name: chapter.course_name,
            chapter_id: chapter.chapter_id,
            chapter_name: chapter.chapter_name,
            users: Array.from(chapter.users.values())
                .sort((left, right) => left.email.localeCompare(right.email))
                .map((groupedUser) => ({
                    user_id: groupedUser.user_id,
                    full_name: groupedUser.full_name,
                    email: groupedUser.email,
                    questions: Array.from(groupedUser.questions.values())
                        .map((question) => ({
                            question_id: question.question_id,
                            question_title: question.question_title,
                            attempt_count: question.attempt_count,
                            attempts: question.attempts.sort(
                                (left, right) =>
                                    new Date(left.created_at).getTime() -
                                    new Date(right.created_at).getTime(),
                            ),
                        }))
                        .sort((left, right) =>
                            left.question_title.localeCompare(right.question_title),
                        ),
                })),
        }))
            .sort((left, right) =>
                left.chapter_name.localeCompare(right.chapter_name),
            );

        const chapterIds = Array.from(new Set(flatAttempts.map((attempt) => attempt.chapter_id)));
        const questionIds = Array.from(new Set(flatAttempts.map((attempt) => attempt.question_id)));
        const filteredUserIds = Array.from(new Set(flatAttempts.map((attempt) => attempt.user_id)));

        const chapterRows: AnalyticsChapterRow[] = [];
        if (chapterIds.length > 0) {
            let chapterQuery = supabaseAdmin
                .from("chapters")
                .select("id, title, course_id, sort_order, courses!course_id ( id, title )")
                .in("id", chapterIds);

            if (selectedCourseId) {
                chapterQuery = chapterQuery.eq("course_id", selectedCourseId);
            }

            const { data: chaptersData } = await chapterQuery.order("sort_order", { ascending: true });
            chapterRows.push(...((chaptersData ?? []) as unknown as AnalyticsChapterRow[]));
        }

        const { data: questionsData } = questionIds.length > 0
            ? await supabaseAdmin
                .from("questions")
                .select("id, chapter_id")
                .in("id", questionIds)
            : { data: [] as AnalyticsQuestionRow[] };

        const { data: completionsData } = questionIds.length > 0 && filteredUserIds.length > 0
            ? await supabaseAdmin
                .from("user_question_completions")
                .select("question_id, user_id")
                .in("question_id", questionIds)
                .in("user_id", filteredUserIds)
            : { data: [] as AnalyticsCompletionRow[] };

        const questionsByChapter = new Map<string, AnalyticsQuestionRow[]>();
        for (const question of (questionsData ?? []) as AnalyticsQuestionRow[]) {
            const existing = questionsByChapter.get(question.chapter_id) ?? [];
            existing.push(question);
            questionsByChapter.set(question.chapter_id, existing);
        }

        const completionsByQuestion = new Map<string, Set<string>>();
        for (const completion of (completionsData ?? []) as AnalyticsCompletionRow[]) {
            const existing = completionsByQuestion.get(completion.question_id) ?? new Set<string>();
            existing.add(completion.user_id);
            completionsByQuestion.set(completion.question_id, existing);
        }

        const analyticsChapterDifficulty = chapterRows.map((chapter) => {
            const chapterAttempts = flatAttempts.filter((attempt) => attempt.chapter_id === chapter.id);
            const averageScore = chapterAttempts.length > 0
                ? chapterAttempts.reduce((sum, attempt) => sum + toPercent(attempt.total_score, attempt.max_possible_score), 0) /
                    chapterAttempts.length
                : 0;

            return {
                chapter_id: chapter.id,
                chapter_name: chapter.title || "Untitled Chapter",
                course_id: chapter.course_id,
                course_name: chapter.courses?.title || "Unknown",
                sort_order: chapter.sort_order ?? Number.MAX_SAFE_INTEGER,
                average_score: Number(averageScore.toFixed(2)),
            };
        }).sort((left, right) => {
            if (left.course_id !== right.course_id) {
                return left.course_name.localeCompare(right.course_name);
            }

            return left.sort_order - right.sort_order || left.chapter_name.localeCompare(right.chapter_name);
        });

        const analyticsCompletionRate = chapterRows.map((chapter) => {
            const questions = questionsByChapter.get(chapter.id) ?? [];
            const totalQuestionCompletions = questions.reduce((sum, question) => {
                const completedUsers = completionsByQuestion.get(question.id);
                return sum + (completedUsers ? completedUsers.size : 0);
            }, 0);

            const completionRate =
                questions.length > 0 && filteredUserIds.length > 0
                    ? (totalQuestionCompletions / (questions.length * filteredUserIds.length)) * 100
                    : 0;

            return {
                chapter_id: chapter.id,
                chapter_name: chapter.title || "Untitled Chapter",
                course_id: chapter.course_id,
                course_name: chapter.courses?.title || "Unknown",
                completion_rate: Number(completionRate.toFixed(2)),
            };
        }).sort((left, right) => {
            if (left.course_id !== right.course_id) {
                return left.course_name.localeCompare(right.course_name);
            }

            return left.chapter_name.localeCompare(right.chapter_name);
        });

        const analyticsScoreDistribution = buildHistogram(
            flatAttempts.map((attempt) => toPercent(attempt.total_score, attempt.max_possible_score)),
        );

        const analyticsSparklineUsers = Array.from(
            flatAttempts.reduce((map, attempt) => {
                const existing = map.get(attempt.user_id) ?? {
                    user_id: attempt.user_id,
                    full_name: attempt.full_name,
                    email: attempt.email,
                    attempts: [] as typeof flatAttempts,
                };

                existing.attempts.push(attempt);
                map.set(attempt.user_id, existing);
                return map;
            }, new Map<string, { user_id: string; full_name: string; email: string; attempts: typeof flatAttempts }>())
                .values(),
        ).map((user) => {
            const points = user.attempts
                .slice()
                .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
                .map((attempt, index) => ({
                    x: index + 1,
                    y: Number(toPercent(attempt.total_score, attempt.max_possible_score).toFixed(2)),
                }));

            const trend = buildLinearRegression(points);
            const averageScore =
                points.length > 0
                    ? points.reduce((sum, point) => sum + point.y, 0) / points.length
                    : 0;

            return {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                average_score: Number(averageScore.toFixed(2)),
                attempt_count: points.length,
                trend,
            };
        }).sort((left, right) => left.average_score - right.average_score);

        return NextResponse.json({
            mode,
            attempts: [...flatAttempts].sort(
                (left, right) =>
                    new Date(right.created_at).getTime() -
                    new Date(left.created_at).getTime(),
            ),
            groupedByChapter,
            analytics: {
                chapterDifficulty: analyticsChapterDifficulty,
                scoreDistribution: analyticsScoreDistribution,
                completionRate: mode === "chapter" ? [] : analyticsCompletionRate,
                sparklines: analyticsSparklineUsers,
            },
            filters: {
                courseId: selectedCourseId,
                chapterId: selectedChapterId,
                userId: selectedUserId,
            },
            _count: flatAttempts.length,
            _totalCount: totalJoinedAttempts,
            _isEmpty: totalJoinedAttempts === 0,
        });
    } catch (error) {
        console.error("Simulation attempts fetch error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}
