import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getSubmoduleHref } from "@/lib/learning-contents";
import { getModuleBySlug, getSubmodules } from "@/lib/supabase/modules";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface ModulePageProps {
    params: Promise<{
        moduleSlug: string;
    }>;
}

export default async function ModuleSubtopicsPage({ params }: ModulePageProps) {
    const { moduleSlug } = await params;
    let learningModule;
    let submodules;

    try {
        learningModule = await getModuleBySlug(moduleSlug);
        submodules = await getSubmodules(learningModule.id);
    } catch (error) {
        const code = typeof error === "object" && error !== null && "code" in error
            ? String(error.code)
            : "";

        if (code === "PGRST116") {
            notFound();
        }

        throw error;
    }

    return (
        <div className="flex flex-1 flex-col gap-6 p-6 w-full max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {learningModule.title}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Select a subtopic to view learning content and assignments.
                </p>
            </div>

            <div className="flex flex-col gap-3">
                {submodules.map((item, index) => (
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
