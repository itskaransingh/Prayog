import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getModulePresentation } from "@/lib/learning-contents";
import { getModules } from "@/lib/supabase/modules";
import Link from "next/link";

export default async function LearningContentsPage() {
    const modules = await getModules();

    return (
        <div className="flex flex-1 flex-col gap-6 p-6 w-full container mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
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
                            <Card className="group h-full transition-all duration-300 hover:shadow-md border-gray-200 hover:-translate-y-1 bg-white overflow-hidden cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gray-50/50 border-b border-gray-100">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`flex size-11 items-center justify-center rounded-lg ${bgColor} ${textColor}`}
                                        >
                                            <Icon className="size-5" />
                                        </div>
                                        <CardTitle className="text-lg font-bold tracking-tight text-gray-900 group-hover:text-blue-700 transition-colors">
                                            {item.title}
                                        </CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-5 pb-5">
                                    <div className="space-y-4">
                                        <p className="text-sm font-medium text-gray-500">
                                            {item.course_count} course{item.course_count !== 1 ? "s" : ""}
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm font-medium">
                                                <span className="text-gray-700">Progress</span>
                                                <span className={item.progress > 0 ? "text-blue-600" : "text-gray-500"}>
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
