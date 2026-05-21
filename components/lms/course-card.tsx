import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { LucideIcon } from "lucide-react";
import type { CourseBanner } from "@/lib/course-banners";
import Link from "next/link";

interface CourseCardProps {
    id: string;
    slug: string;
    title: string;
    chapterCount: number;
    progress: number;
    Icon: LucideIcon;
    bgColor: string;
    textColor: string;
    banner: CourseBanner;
    showXP?: boolean;
}

export function CourseCard({
    id,
    slug,
    title,
    chapterCount,
    progress,
    Icon,
    bgColor,
    textColor,
    banner,
    showXP = false,
}: CourseCardProps) {
    return (
        <Link href={`/learning-contents/${slug}`}>
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
                            {title}
                        </CardTitle>
                        <p className="text-xs font-semibold text-muted-foreground">
                            {chapterCount} chapter{chapterCount !== 1 ? "s" : ""}
                        </p>
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-foreground/80">Progress</span>
                                <span className={progress > 0 ? "text-primary" : "text-muted-foreground"}>
                                    {progress}%
                                </span>
                            </div>
                            <Progress value={progress} className="h-1.5 w-full" />
                        </div>
                        {showXP && (
                            <div className="flex items-center gap-1 text-xs text-orange-500 font-semibold">
                                🔥 +{Math.round(progress * 3.5)} XP
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
