import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get("limit");
        const limit = limitParam ? parseInt(limitParam, 10) : 20;

        const supabase = await createClient();
        const supabaseAdmin = createAdminClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        const { data: leaderboardData, error } = await supabaseAdmin
            .from("user_xp")
            .select("user_id, total_xp")
            .order("total_xp", { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        if (!leaderboardData || leaderboardData.length === 0) {
            return NextResponse.json({
                entries: [],
                yourRank: null,
                yourXP: null,
            });
        }

        const userIds = leaderboardData.map((entry) => entry.user_id);

        const { data: profiles } = await supabaseAdmin
            .from("profiles")
            .select("id, full_name")
            .in("id", userIds);

        const profileMap = new Map(
            (profiles ?? []).map((p) => [p.id, p]),
        );

        const entries = leaderboardData.map((entry, index) => {
            const profile = profileMap.get(entry.user_id);
            const name: string = profile?.full_name ?? `Learner ${index + 1}`;
            const initials = name
                .split(" ")
                .map((n: string) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase() || "??";
            return {
                rank: index + 1,
                user_id: entry.user_id,
                name,
                initials,
                total_xp: entry.total_xp,
                isYou: user?.id === entry.user_id,
            };
        });

        let yourRank = null;
        let yourXP = null;

        if (user) {
            const yourEntry = entries.find((e) => e.isYou);
            if (yourEntry) {
                yourRank = yourEntry.rank;
                yourXP = yourEntry.total_xp;
            } else {
                const { data: yourXPData } = await supabaseAdmin
                    .from("user_xp")
                    .select("total_xp")
                    .eq("user_id", user.id)
                    .maybeSingle();

                if (yourXPData) {
                    yourXP = yourXPData.total_xp;
                    const { count } = await supabaseAdmin
                        .from("user_xp")
                        .select("user_id", { count: "exact" })
                        .gt("total_xp", yourXP);

                    yourRank = (count ?? 0) + 1;
                }
            }
        }

        return NextResponse.json({
            entries,
            yourRank,
            yourXP,
        });
    } catch (error) {
        console.error("Failed to fetch leaderboard", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}