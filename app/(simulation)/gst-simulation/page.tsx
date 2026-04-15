import { createClient } from "@/lib/supabase/server";
import { GSTIN_SUBMODULE_ID } from "@/lib/simulation/gst/gstin-registration";
import { GSTTrnRegistrationClient } from "@/components/simulation/gst/trn-registration-client";
import { GSTGstinRegistrationClient } from "@/components/simulation/gst/gstin-registration-client";

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

    if (questionId) {
        const supabase = await createClient();
        const { data } = await supabase
            .from("questions")
            .select("submodule_id")
            .eq("id", questionId)
            .maybeSingle();

        if (data?.submodule_id === GSTIN_SUBMODULE_ID) {
            return (
                <GSTGstinRegistrationClient
                    questionId={questionId}
                    initialMode={mode ?? null}
                />
            );
        }
    }

    return (
        <GSTTrnRegistrationClient
            questionId={questionId ?? null}
            initialMode={mode ?? null}
        />
    );
}
