import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getModulePresentation } from "@/lib/learning-contents";
import { getCourseBanner } from "@/lib/course-banners";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Flame, Zap, Rocket, Star, ArrowRight } from "lucide-react";

const ACHIEVEMENTS = [
    { icon: Flame, title: "Streak Master", desc: "Maintain a 7 day streak", xp: "+100 XP", bg: "bg-orange-100 dark:bg-orange-900/30" },
    { icon: Zap, title: "Task Ace", desc: "Complete 10 tasks", xp: "+200 XP", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
    { icon: Rocket, title: "Explorer", desc: "Explore 3 new programs", xp: "+150 XP", bg: "bg-blue-100 dark:bg-blue-900/30" },
    { icon: Star, title: "Top Performer", desc: "Score in top 20%", xp: "+250 XP", bg: "bg-red-100 dark:bg-red-900/30" },
];

export async function ProgramsDashboard() {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return (
            <div className="flex mx-auto container flex-1 flex-col gap-4 p-5">
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
        .eq("is_hidden", false)
        .order("created_at", { ascending: true })
        .limit(3);

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
        <div className="flex mx-auto container flex-1 flex-col gap-4 p-5">
            {/* Mission Banner */}
            <div className="relative overflow-hidden rounded-lg p-6 min-h-[140px] flex items-center gap-6 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 dark:from-blue-950 dark:via-blue-900 dark:to-indigo-950 border border-blue-700/50 dark:border-blue-800/50">
                <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: `radial-gradient(1.5px 1.5px at 15% 25%, white 0%, transparent 100%),
                    radial-gradient(1px 1px at 45% 15%, white 0%, transparent 100%),
                    radial-gradient(1px 1px at 70% 30%, white 0%, transparent 100%)`
                }} />
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-300 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg text-2xl">
                    ⭐
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-blue-300 tracking-wider uppercase mb-1">Today&apos;s Mission</div>
                    <div className="text-2xl font-bold text-white mb-1">Explore Our Programs</div>
                    <div className="text-sm text-blue-200/80">Access your enrolled programs and explore new offerings.</div>
                </div>
                <div className="text-5xl absolute right-28 bottom-0 opacity-20 pointer-events-none"></div>
                <Link href="/learning-contents" className="flex-shrink-0 bg-white text-blue-900 hover:bg-blue-50 rounded-lg py-3 px-6 text-base font-bold flex items-center gap-1.5 transition-colors cursor-pointer relative z-10">
                    Continue <span>→</span>
                </Link>
            </div>

            {/* Section Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground dark:text-slate-100">
                        Prayog Offerings
                    </h2>
                    <p className="text-muted-foreground dark:text-slate-400 text-xs">
                        Explore programs, learn new skills, and achieve your goals.
                    </p>
                </div>
                <Link href="/learning-contents" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    See All
                </Link>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {coursesWithProgress.map((item) => {
                    const { Icon, bgColor, textColor } = getModulePresentation(
                        item.title,
                        item.icon_name,
                        item.bg_color,
                        item.text_color
                    );
                    const banner = getCourseBanner(item.title);

                    return (
                        <Link key={item.id} href={`/learning-contents/${item.slug}`}>
                            <Card className="group h-full transition-all duration-300 hover:shadow-lg border-border hover:-translate-y-1 bg-card overflow-hidden cursor-pointer">
                                <div className={`relative h-[155px] bg-gradient-to-br ${banner.gradient} overflow-hidden`}>
                                    {banner.decoration}
                                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: banner.starfieldDots }} />
                                    <div className="absolute bottom-3 left-4 flex items-center gap-2">
                                        <div className={`flex size-8 items-center justify-center rounded-lg ${bgColor} ${textColor} shadow-md`}>
                                            <Icon className="size-4" />
                                        </div>
                                    </div>
                                </div>

                                <CardContent className="pt-4 pb-4 px-4">
                                    <div className="space-y-3">
                                        <CardTitle className="text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                            {item.title}
                                        </CardTitle>
                                        <p className="text-xs font-semibold text-muted-foreground">
                                            {item.course_count} chapter{item.course_count !== 1 ? "s" : ""}
                                        </p>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs font-bold">
                                                <span className="text-foreground/80">Progress</span>
                                                <span className={item.progress > 0 ? "text-primary" : "text-muted-foreground"}>
                                                    {item.progress}%
                                                </span>
                                            </div>
                                            <Progress value={item.progress} className="h-1.5 w-full" />
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-orange-500 font-semibold">
                                             +{Math.round(item.progress * 3.5)} XP
                                        </div>
                                        <div className="pt-1">
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-primary group-hover:underline">
                                                Continue Learning <ArrowRight className="w-3 h-3" />
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {/* Achievements */}
            <div>
                <div className="text-base font-bold text-foreground dark:text-slate-100 mb-3">Earn More. Learn More. Level Up!</div>
                <div className="grid grid-cols-4 gap-4">
                    {ACHIEVEMENTS.map((achievement) => (
                        <Card key={achievement.title} className="h-24 bg-card dark:bg-slate-900/50 border-border dark:border-slate-800 p-3">
                            <div className="flex items-start gap-3 h-full">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${achievement.bg}`}>
                                    <achievement.icon className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <div className="text-xs font-semibold text-foreground dark:text-slate-200 truncate">{achievement.title}</div>
                                    <div className="text-[11px] text-muted-foreground dark:text-slate-400 truncate">{achievement.desc}</div>
                                    <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-auto">{achievement.xp}</div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
