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

    // Fetch modules directly (not cached, since we need per-user progress)
    const { data: modules } = await supabaseAdmin
        .from("modules")
        .select("id, title, slug, course_count, icon_name, bg_color, text_color")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

    // Calculate per-user progress for each module
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

        // Fetch submodules for all modules
        const { data: submodules } = await supabaseAdmin
            .from("submodules")
            .select("id, module_id")
            .in("module_id", moduleIds)
            .eq("is_active", true);

        const submoduleIds = (submodules ?? []).map((s) => s.id);

        if (submoduleIds.length > 0) {
            // Fetch all questions for these submodules
            const { data: allQuestions } = await supabaseAdmin
                .from("questions")
                .select("id, type, submodule_id")
                .in("submodule_id", submoduleIds);

            const questionIds = (allQuestions ?? []).map((q) => q.id);

            // Fetch user completions and attempts
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

            // Map questions to modules
            const questionsByModule = new Map<string, typeof allQuestions>();
            for (const q of allQuestions ?? []) {
                const submodule = submodules?.find((s) => s.id === q.submodule_id);
                if (submodule) {
                    const list = questionsByModule.get(submodule.module_id) ?? [];
                    list.push(q);
                    questionsByModule.set(submodule.module_id, list);
                }
            }

            // Calculate progress per module
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
                                            {item.course_count} course{item.course_count !== 1 ? "s" : ""}
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
