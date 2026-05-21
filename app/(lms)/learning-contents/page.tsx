import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getModulePresentation } from "@/lib/learning-contents";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { LmsBreadcrumbs } from "@/components/lms/lms-breadcrumbs";

export default async function LearningContentsPage() {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return (
            <div className="flex flex-1 flex-col gap-6 p-6 w-full container mx-auto">
                <p className="text-muted-foreground">Please log in to view your courses.</p>
            </div>
        );
    }

    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const isSuperAdmin = profile?.role === "super_admin";

    let accessibleCourseIds: string[] = [];

    if (!isSuperAdmin) {
        const { data: courseAccess } = await supabaseAdmin
            .from("user_course_access")
            .select("course_id")
            .eq("user_id", user.id);

        accessibleCourseIds = courseAccess?.map((a) => a.course_id) || [];
    }

    const coursesQuery = supabaseAdmin
        .from("courses")
        .select("id, title, slug, course_count, icon_name, bg_color, text_color")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

    const { data: courses } = isSuperAdmin
        ? await coursesQuery
        : await coursesQuery.in("id", accessibleCourseIds);

    interface CourseWithProgress {
        id: string;
        title: string;
        slug: string;
        course_count: number;
        icon_name: string;
        bg_color: string;
        text_color: string;
        progress: number;
    }

    const coursesWithProgress: CourseWithProgress[] = (courses ?? []).map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        course_count: c.course_count,
        icon_name: c.icon_name,
        bg_color: c.bg_color,
        text_color: c.text_color,
        progress: 0,
    }));

    if (courses && courses.length > 0) {
        const courseIds = courses.map((c) => c.id);

        const { data: chapters } = await supabaseAdmin
            .from("chapters")
            .select("id, course_id")
            .in("course_id", courseIds)
            .eq("is_active", true);

        const chapterIds = (chapters ?? []).map((c) => c.id);

        if (chapterIds.length > 0) {
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

            const questionsByCourse = new Map<string, typeof allQuestions>();
            for (const q of allQuestions ?? []) {
                const chapter = chapters?.find((c) => c.id === q.chapter_id);
                if (chapter) {
                    const list = questionsByCourse.get(chapter.course_id) ?? [];
                    list.push(q);
                    questionsByCourse.set(chapter.course_id, list);
                }
            }

            for (const course of coursesWithProgress) {
                const courseQuestions = questionsByCourse.get(course.id) ?? [];

                if (courseQuestions.length > 0) {
                    const completedCount = courseQuestions.filter(
                        (q) =>
                            q.type === "question"
                                ? attemptedQuestionIds.has(q.id)
                                : completedQuestionIds.has(q.id),
                    ).length;

                    course.progress = Math.round((completedCount / courseQuestions.length) * 100);
                }
            }
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-6 w-full container mx-auto">
            <LmsBreadcrumbs
                items={[
                    { label: "Prayog Offerings", href: "/offerings" },
                    { label: "Learning Contents" },
                ]}
            />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Learning Contents
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Browse courses by subject. Track your progress for each area.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {coursesWithProgress.map((item) => {
                    const { Icon, bgColor, textColor } = getModulePresentation(
                        item.title,
                        item.icon_name,
                        item.bg_color,
                        item.text_color
                    );

                    return (
                        <Link key={item.id} href={`/learning-contents/${item.slug}`}>
                            <Card className="group h-full transition-all duration-300 hover:shadow-md border-border hover:-translate-y-1 bg-card overflow-hidden cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-muted/30 border-b border-border">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`flex size-11 items-center justify-center rounded-lg ${bgColor} ${textColor} shadow-sm`}
                                        >
                                            <Icon className="size-5" />
                                        </div>
                                        <CardTitle className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                            {item.title}
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-5 pb-5">
                                    <div className="space-y-4">
                                        <p className="text-sm font-semibold text-muted-foreground">
                                            {item.course_count} chapter{item.course_count !== 1 ? "s" : ""}
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm font-bold">
                                                <span className="text-foreground/80">Progress</span>
                                                <span className={item.progress > 0 ? "text-primary" : "text-muted-foreground"}>
                                                    {item.progress}%
                                                </span>
                                            </div>
                                            <Progress value={item.progress} className="h-2 w-full" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
