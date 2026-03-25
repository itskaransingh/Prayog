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

        const submoduleId = request.nextUrl.searchParams.get("submoduleId");
        if (!submoduleId) {
            return NextResponse.json(
                { error: "submoduleId query param is required" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("questions")
            .select("*")
            .eq("submodule_id", submoduleId)
            .order("created_at", { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ questions: data });
    } catch (error: unknown) {
        console.error("Error fetching questions:", error);
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
        const {
            submodule_id,
            title,
            paragraph,
            has_table,
            table_data,
            has_image,
            image_url,
        } = body;

        if (!submodule_id || !title) {
            return NextResponse.json(
                { error: "submodule_id and title are required" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("questions")
            .insert({
                submodule_id,
                title,
                paragraph: paragraph ?? "",
                has_table: Boolean(has_table),
                table_data: has_table ? table_data : null,
                has_image: Boolean(has_image),
                image_url: has_image ? image_url : null,
            })
            .select("*")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ question: data }, { status: 201 });
    } catch (error: unknown) {
        console.error("Error creating question:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
