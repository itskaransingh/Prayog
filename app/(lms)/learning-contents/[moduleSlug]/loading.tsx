import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingModuleSubtopicsPage() {
    return (
        <div className="flex flex-1 flex-col gap-6 p-6 w-full max-w-4xl mx-auto">
            <div className="space-y-3">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-4 w-80" />
            </div>

            <div className="flex flex-col gap-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="rounded-xl border border-border bg-card p-5">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-5 w-52" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                                <Skeleton className="h-2 w-full" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
