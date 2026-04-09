import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getSubmoduleHref } from "@/lib/learning-contents";
import { getCachedModuleBySlug } from "@/lib/supabase/lms-cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import { LmsBreadcrumbs } from "@/components/lms/lms-breadcrumbs";

interface ModulePageProps {
    params: Promise<{
        moduleSlug: string;
    }>;
}

export default async function ModuleSubtopicsPage({ params }: ModulePageProps) {
    const { moduleSlug } = await params;
    let learningModule;
    let submodulesWithProgress;

    try {
        learningModule = await getCachedModuleBySlug(moduleSlug);
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

    // Fetch submodules directly (not cached, since we need per-user progress)
    const { data: submodules, error: submodulesError } = await supabaseAdmin
        .from("submodules")
        .select("id, title, slug, task_count")
        .eq("module_id", learningModule.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

    if (submodulesError) throw submodulesError;

    // Calculate per-user progress for each submodule
    if (user && submodules && submodules.length > 0) {
        const submoduleIds = submodules.map((s) => s.id);

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

        // Calculate progress per submodule
        submodulesWithProgress = submodules.map((submodule) => {
            const submoduleQuestions = (allQuestions ?? []).filter(
                (q) => q.submodule_id === submodule.id,
            );

            if (submoduleQuestions.length === 0) {
                return { ...submodule, progress: 0 };
            }

            const completedCount = submoduleQuestions.filter(
                (q) =>
                    q.type === "question"
                        ? attemptedQuestionIds.has(q.id)
                        : completedQuestionIds.has(q.id),
            ).length;

            const progress = Math.round((completedCount / submoduleQuestions.length) * 100);
            return { ...submodule, progress };
        });
    } else {
        // No user or no submodules - show 0 progress
        submodulesWithProgress = (submodules ?? []).map((s) => ({ ...s, progress: 0 }));
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-6 w-full max-w-4xl mx-auto">
            <LmsBreadcrumbs
                items={[
                    { label: "Prayog Offerings", href: "/offerings" },
                    { label: "Learning Contents", href: "/learning-contents" },
                    { label: learningModule.title },
                ]}
            />

            <div className="flex flex-col gap-4">
                <Link href="/learning-contents" className="w-fit">
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground -ml-2">
                        <ChevronLeft className="size-4" />
                        Back to Modules
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {learningModule.title}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Select a subtopic to view learning content and assignments.
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {submodulesWithProgress.map((item, index) => (
                    <Link
                        key={item.id}
                        href={getSubmoduleHref(moduleSlug, item.slug)}
                    >
                        <Card className="group w-full transition-all duration-200 hover:shadow-md border-border hover:border-primary/50 bg-card cursor-pointer overflow-hidden">
                            <CardContent className="flex flex-row items-center gap-4 py-4 px-5">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm shadow-sm">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                                            {item.title}
                                        </span>
                                        <span className="text-sm font-semibold text-muted-foreground shrink-0">
                                            {item.task_count} task{item.task_count !== 1 ? "s" : ""}
                                        </span>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                                            <span className="text-foreground/70">Progress</span>
                                            <span className={item.progress > 0 ? "text-primary" : ""}>
                                                {item.progress}%
                                            </span>
                                        </div>
                                        <Progress value={item.progress} className="h-2" />
                                    </div>
                                </div>
                                <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
