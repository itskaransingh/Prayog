import { verifyAdminAccess } from "@/lib/supabase/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const admin = await verifyAdminAccess(supabase);

        if (!admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { evaluation_data } = body;

        if (evaluation_data === undefined) {
            return NextResponse.json(
                { error: "evaluation_data is required" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("evaluation_criteria")
            .update({ evaluation_data })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ evaluationCriteria: data });
    } catch (error: unknown) {
        console.error("Error updating evaluation criteria:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const admin = await verifyAdminAccess(supabase);

        if (!admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { error } = await supabase
            .from("evaluation_criteria")
            .delete()
            .eq("id", id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: "Evaluation criteria deleted" });
    } catch (error: unknown) {
        console.error("Error deleting evaluation criteria:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
