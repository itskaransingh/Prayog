import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getModulePresentation } from "@/lib/learning-contents";
import { getCachedModules } from "@/lib/supabase/lms-cache";
import Link from "next/link";
import { LmsBreadcrumbs } from "@/components/lms/lms-breadcrumbs";

export default async function LearningContentsPage() {
    const modules = await getCachedModules();

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
                {modules.map((item) => {
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
