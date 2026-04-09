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
                submodule_id: string;
                submodules: {
                    id: string;
                    title: string | null;
                    module_id: string;
                    modules: {
                        id: string;
                        title: string | null;
                    } | null;
                } | null;
            } | null;
        } | null;
    } | null;
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

        if (profileError || !profile || profile.role !== "admin") {
            return NextResponse.json(
                { error: "Forbidden: Admins only" },
                { status: 403 },
            );
        }

        const url = new URL(request.url);
        const selectedModuleId = url.searchParams.get("moduleId");
        const selectedSubmoduleId = url.searchParams.get("submoduleId");

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
                        submodule_id,
                        submodules!submodule_id (
                            id,
                            title,
                            module_id,
                            modules!module_id (
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
                const submodule = getFirst(question?.submodules);
                const moduleRecord = getFirst(submodule?.modules);

                if (!simulationAttempt || !question || !submodule) {
                    return null;
                }

                return {
                    full_name:
                        profileMap[simulationAttempt.user_id]?.full_name || "Unknown User",
                    question_attempt_id: attempt.id,
                    attempt_id: simulationAttempt.id,
                    user_id: simulationAttempt.user_id,
                    email: profileMap[simulationAttempt.user_id]?.email || "Unknown",
                    module_id: moduleRecord?.id || "",
                    module_name: moduleRecord?.title || "Unknown",
                    submodule_id: submodule.id,
                    submodule_name: submodule.title || "Unknown",
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
                if (selectedModuleId && attempt.module_id !== selectedModuleId) {
                    return false;
                }

                if (selectedSubmoduleId && attempt.submodule_id !== selectedSubmoduleId) {
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

        const groupedBySubmodule = Array.from(
            flatAttempts.reduce((submoduleMap, attempt) => {
                const submoduleKey = attempt.submodule_id;
                const existingSubmodule = submoduleMap.get(submoduleKey) ?? {
                    module_id: attempt.module_id,
                    module_name: attempt.module_name,
                    submodule_id: attempt.submodule_id,
                    submodule_name: attempt.submodule_name,
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

                const existingUser = existingSubmodule.users.get(attempt.user_id) ?? {
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
                existingSubmodule.users.set(attempt.user_id, existingUser);
                submoduleMap.set(submoduleKey, existingSubmodule);
                return submoduleMap;
            }, new Map<string, {
                module_id: string;
                module_name: string;
                submodule_id: string;
                submodule_name: string;
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
        ).map((submodule) => ({
            module_id: submodule.module_id,
            module_name: submodule.module_name,
            submodule_id: submodule.submodule_id,
            submodule_name: submodule.submodule_name,
            users: Array.from(submodule.users.values())
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
                left.submodule_name.localeCompare(right.submodule_name),
            );

        return NextResponse.json({
            attempts: [...flatAttempts].sort(
                (left, right) =>
                    new Date(right.created_at).getTime() -
                    new Date(left.created_at).getTime(),
            ),
            groupedBySubmodule,
            filters: {
                moduleId: selectedModuleId,
                submoduleId: selectedSubmoduleId,
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
