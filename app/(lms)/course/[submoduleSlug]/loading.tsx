import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingCoursePage() {
    return (
        <div className="flex container mx-auto flex-1 flex-col gap-6 p-6 pb-32 bg-background text-foreground">
            <div className="space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-8 w-72" />
                <Skeleton className="h-4 w-64" />
            </div>

            <Skeleton className="h-px w-full rounded-none" />

            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>

            <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 p-4 backdrop-blur-md">
                <div className="container mx-auto flex items-center justify-between gap-4">
                    <Skeleton className="h-9 w-36" />
                    <Skeleton className="h-11 w-44" />
                    <Skeleton className="h-9 w-36" />
                </div>
            </div>
        </div>
    );
}
