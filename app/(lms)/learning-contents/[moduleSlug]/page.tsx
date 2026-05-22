import { getSubmoduleHref } from "@/lib/learning-contents";
import { getCachedCourseBySlug } from "@/lib/supabase/lms-cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { FinancialAccountingMap } from "@/components/lms/financial-accounting-map";
import Link from "next/link";

interface CoursePageProps {
    params: Promise<{
        moduleSlug: string;
    }>;
}

export default async function CourseChaptersPage({ params }: CoursePageProps) {
    const { moduleSlug } = await params;
    let course;
    let chaptersWithProgress;

    try {
        course = await getCachedCourseBySlug(moduleSlug);
    } catch (error) {
        const code = typeof error === "object" && error !== null && "code" in error
            ? String(error.code)
            : "";

        if (code === "PGRST116") {
            notFound();
        }

        throw error;
    }

    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: chapters, error: chaptersError } = await supabaseAdmin
        .from("chapters")
        .select("id, title, slug, task_count")
        .eq("course_id", course.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

    if (chaptersError) throw chaptersError;

    if (user && chapters && chapters.length > 0) {
        const chapterIds = chapters.map((c) => c.id);

        const { data: allQuestions } = await supabaseAdmin
            .from("questions")
            .select("id, type, chapter_id")
            .in("chapter_id", chapterIds);

        const questionIds = (allQuestions ?? []).map((q) => q.id);

        const { data: completions } = await supabaseAdmin
            .from("user_question_completions")
            .select("question_id")
            .in("question_id", questionIds)
            .eq("user_id", user.id);

        const { data: attempts } = await supabaseAdmin
            .from("user_question_attempts")
            .select("question_id, user_simulation_attempts!attempt_id!inner(user_id)")
            .in("question_id", questionIds)
            .eq("user_simulation_attempts.user_id", user.id);

        const completedQuestionIds = new Set((completions ?? []).map((c) => c.question_id));
        const attemptedQuestionIds = new Set((attempts ?? []).map((a) => a.question_id));

        chaptersWithProgress = chapters.map((chapter) => {
            const chapterQuestions = (allQuestions ?? []).filter(
                (q) => q.chapter_id === chapter.id,
            );

            if (chapterQuestions.length === 0) {
                return { ...chapter, progress: 0 };
            }

            const completedCount = chapterQuestions.filter(
                (q) =>
                    q.type === "question"
                        ? attemptedQuestionIds.has(q.id)
                        : completedQuestionIds.has(q.id),
            ).length;

            const progress = Math.round((completedCount / chapterQuestions.length) * 100);
            return { ...chapter, progress };
        });
    } else {
        chaptersWithProgress = (chapters ?? []).map((c) => ({ ...c, progress: 0 }));
    }

    if (course.title === "Financial Accounting") {
        return (
            <FinancialAccountingMap
                courseTitle={course.title}
                moduleSlug={moduleSlug}
                chapters={chaptersWithProgress}
            />
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-6 w-full max-w-4xl mx-auto">
            <Link href="/learning-contents" className="w-fit">
                Back to Courses
            </Link>
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {course.title}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Select a chapter to view learning content and assignments.
                </p>
            </div>

            <div className="flex flex-col gap-3">
                {chaptersWithProgress.map((item, index) => (
                    <Link key={item.id} href={getSubmoduleHref(moduleSlug, item.slug)}>
                        <div className="rounded-lg border border-border bg-card p-4">
                            {index + 1}. {item.title}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
