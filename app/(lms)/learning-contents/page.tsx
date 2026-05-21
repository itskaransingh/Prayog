import { getModulePresentation } from "@/lib/learning-contents";
import { getCourseBanner } from "@/lib/course-banners";
import { CourseCard } from "@/components/lms/course-card";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
                    { label: "Home", href: "/" },
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
                    const banner = getCourseBanner(item.title);

                    return (
                        <CourseCard
                            key={item.id}
                            id={item.id}
                            slug={item.slug}
                            title={item.title}
                            chapterCount={item.course_count}
                            progress={item.progress}
                            Icon={Icon}
                            bgColor={bgColor}
                            textColor={textColor}
                            banner={banner}
                        />
                    );
                })}
            </div>
        </div>
    );
}
