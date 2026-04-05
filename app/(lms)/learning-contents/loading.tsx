import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingLearningContentsPage() {
    return (
        <div className="flex flex-1 flex-col gap-6 p-6 w-full container mx-auto">
            <div className="space-y-2">
                <Skeleton className="h-9 w-72" />
                <Skeleton className="h-4 w-80" />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="rounded-xl border border-border bg-card p-5 space-y-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-11 w-11 rounded-lg" />
                            <Skeleton className="h-6 w-40" />
                        </div>
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-2 w-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}
