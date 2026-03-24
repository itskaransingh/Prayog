import { verifyAdminAccess } from "@/lib/supabase/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const admin = await verifyAdminAccess(supabase);

        if (!admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const questionId = request.nextUrl.searchParams.get("questionId");
        if (!questionId) {
            return NextResponse.json(
                { error: "questionId query param is required" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("evaluation_criteria")
            .select("*")
            .eq("question_id", questionId)
            .order("created_at", { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ evaluationCriteria: data });
    } catch (error: unknown) {
        console.error("Error fetching evaluation criteria:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const admin = await verifyAdminAccess(supabase);

        if (!admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { question_id, evaluation_data } = body;

        if (!question_id || !evaluation_data) {
            return NextResponse.json(
                { error: "question_id and evaluation_data are required" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("evaluation_criteria")
            .upsert(
                { question_id, evaluation_data },
                { onConflict: "question_id" }
            )
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ evaluationCriteria: data }, { status: 201 });
    } catch (error: unknown) {
        console.error("Error saving evaluation criteria:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
