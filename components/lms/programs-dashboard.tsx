import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getModulePresentation } from "@/lib/learning-contents";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { Flame, Zap, Rocket, Star } from "lucide-react";

const ACHIEVEMENTS = [
    { icon: Flame, title: "Streak Master", desc: "7 day streak", xp: "+100 XP", bg: "bg-orange-100 dark:bg-orange-900/30" },
    { icon: Zap, title: "Task Ace", desc: "Complete 10 tasks", xp: "+200 XP", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
    { icon: Rocket, title: "Explorer", desc: "3 new programs", xp: "+150 XP", bg: "bg-blue-100 dark:bg-blue-900/30" },
    { icon: Star, title: "Top Performer", desc: "Top 20%", xp: "+250 XP", bg: "bg-purple-100 dark:bg-purple-900/30" },
];

export async function ProgramsDashboard() {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();

    const { data: modules } = await supabaseAdmin
        .from("modules")
        .select("id, title, slug, course_count, icon_name, bg_color, text_color")
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(3);

    interface ModuleWithProgress {
        id: string;
        title: string;
        slug: string;
        course_count: number;
        icon_name: string;
        bg_color: string;
        text_color: string;
        progress: number;
    }

    const modulesWithProgress: ModuleWithProgress[] = (modules ?? []).map((mod) => ({
        id: mod.id,
        title: mod.title,
        slug: mod.slug,
        course_count: mod.course_count,
        icon_name: mod.icon_name,
        bg_color: mod.bg_color,
        text_color: mod.text_color,
        progress: 0,
    }));

    if (user && modules && modules.length > 0) {
        const moduleIds = modules.map((m) => m.id);

        const { data: submodules } = await supabaseAdmin
            .from("submodules")
            .select("id, module_id")
            .in("module_id", moduleIds)
            .eq("is_active", true);

        const submoduleIds = (submodules ?? []).map((s) => s.id);

        if (submoduleIds.length > 0) {
            const { data: allQuestions } = await supabaseAdmin
                .from("questions")
                .select("id, type, submodule_id")
                .in("submodule_id", submoduleIds);

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

            const questionsByModule = new Map<string, typeof allQuestions>();
            for (const q of allQuestions ?? []) {
                const submodule = submodules?.find((s) => s.id === q.submodule_id);
                if (submodule) {
                    const list = questionsByModule.get(submodule.module_id) ?? [];
                    list.push(q);
                    questionsByModule.set(submodule.module_id, list);
                }
            }

            for (const mod of modulesWithProgress) {
                const moduleQuestions = questionsByModule.get(mod.id) ?? [];

                if (moduleQuestions.length > 0) {
                    const completedCount = moduleQuestions.filter(
                        (q) =>
                            q.type === "question"
                                ? attemptedQuestionIds.has(q.id)
                                : completedQuestionIds.has(q.id),
                    ).length;

                    mod.progress = Math.round((completedCount / moduleQuestions.length) * 100);
                }
            }
        }
    }

    return (
        <div className="flex mx-auto container flex-1 flex-col gap-3 p-4">
            {/* Mission Banner - Compact */}
            <div className="relative overflow-hidden rounded-lg p-4 flex items-center gap-3 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 dark:from-blue-950 dark:via-blue-900 dark:to-indigo-950 border border-blue-700/50 dark:border-blue-800/50">
                <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: `radial-gradient(1.5px 1.5px at 15% 25%, white 0%, transparent 100%),
                    radial-gradient(1px 1px at 45% 15%, white 0%, transparent 100%),
                    radial-gradient(1px 1px at 70% 30%, white 0%, transparent 100%)`
                }} />
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-300 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg text-lg">
                    ⭐
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-blue-300 tracking-wider uppercase">Today&apos;s Mission</div>
                    <div className="text-base font-bold text-white">Explore Our Programs</div>
                    <div className="text-xs text-blue-200/80">Access your enrolled programs and explore new offerings.</div>
                </div>
                <div className="text-4xl absolute right-24 bottom-0 opacity-20 pointer-events-none">🦌</div>
                <Link href="/learning-contents" className="flex-shrink-0 bg-white text-blue-900 hover:bg-blue-50 rounded-md py-2 px-4 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer relative z-10">
                    Continue <span>→</span>
                </Link>
            </div>

            {/* Section Header - Compact */}
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-base font-bold tracking-tight text-foreground dark:text-slate-100">
                        Prayog Offerings
                    </h2>
                    <p className="text-muted-foreground dark:text-slate-400 text-xs">
                        Explore programs, learn new skills, and achieve your goals.
                    </p>
                </div>
            </div>

            {/* Modules Grid - Compact */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {modulesWithProgress.map((item) => {
                    const { Icon, bgColor, textColor } = getModulePresentation(
                        item.title,
                        item.icon_name,
                        item.bg_color,
                        item.text_color
                    );

                    return (
                        <Link key={item.id} href={`/learning-contents/${item.slug}`}>
                            <Card className="group h-full transition-all duration-300 hover:shadow-md border-border hover:-translate-y-1 bg-card overflow-hidden cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/30 dark:bg-slate-800/30 border-b border-border py-3">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`flex size-9 items-center justify-center rounded-lg ${bgColor} ${textColor} shadow-sm`}
                                        >
                                            <Icon className="size-4" />
                                        </div>
                                        <CardTitle className="text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                            {item.title}
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-3 pb-3">
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-muted-foreground">
                                            {item.course_count} course{item.course_count !== 1 ? "s" : ""}
                                        </p>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between text-xs font-bold">
                                                <span className="text-foreground/80">Progress</span>
                                                <span className={item.progress > 0 ? "text-primary" : "text-muted-foreground"}>
                                                    {item.progress}%
                                                </span>
                                            </div>
                                            <Progress value={item.progress} className="h-1.5 w-full" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            <Link href="/learning-contents" className="text-xs font-medium text-muted-foreground hover:text-primary underline underline-offset-4 transition-colors">
                Show more...
            </Link>

            {/* Achievements - Compact */}
            <div>
                <div className="text-sm font-bold text-foreground dark:text-slate-100 mb-2">Earn More. Learn More. Level Up!</div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {ACHIEVEMENTS.map((achievement) => (
                        <Card key={achievement.title} className="bg-card dark:bg-slate-900/50 border-border dark:border-slate-800 p-2.5 flex items-start gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${achievement.bg}`}>
                                <achievement.icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-xs font-semibold text-foreground dark:text-slate-200 truncate">{achievement.title}</div>
                                <div className="text-[10px] text-muted-foreground dark:text-slate-400 truncate">{achievement.desc}</div>
                                <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{achievement.xp}</div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
