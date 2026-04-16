import { NilReturn3bClient } from "@/components/simulation/gst/nil-return-3b-client";

interface PageProps {
    searchParams: Promise<{ questionId?: string; mode?: string }>;
}

export default async function NilReturn3bSimulationPage({
    searchParams,
}: PageProps) {
    const { questionId, mode } = await searchParams;

    return (
        <NilReturn3bClient
            questionId={questionId ?? null}
            initialMode={mode ?? null}
        />
    );
}
