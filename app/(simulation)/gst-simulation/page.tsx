import { GSTTrnRegistrationClient } from "@/components/simulation/gst/trn-registration-client";

interface GSTSimulationPageProps {
    searchParams: Promise<{
        questionId?: string;
        mode?: string;
    }>;
}

export default async function GSTSimulationPage({
    searchParams,
}: GSTSimulationPageProps) {
    const { questionId, mode } = await searchParams;

    return (
        <GSTTrnRegistrationClient
            questionId={questionId ?? null}
            initialMode={mode ?? null}
        />
    );
}
