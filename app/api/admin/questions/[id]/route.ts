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
        const {
            title,
            paragraph,
            has_table,
            table_data,
            has_image,
            image_url,
        } = body;

        const updateData: Record<string, unknown> = {};
        if (title !== undefined) updateData.title = title;
        if (paragraph !== undefined) updateData.paragraph = paragraph;
        if (has_table !== undefined) updateData.has_table = has_table;
        if (table_data !== undefined || has_table === false) {
            updateData.table_data = has_table === false ? null : table_data;
        }
        if (has_image !== undefined) updateData.has_image = has_image;
        if (image_url !== undefined || has_image === false) {
            updateData.image_url = has_image === false ? null : image_url;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: "No fields to update" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("questions")
            .update(updateData)
            .eq("id", id)
            .select("*")
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ question: data });
    } catch (error: unknown) {
        console.error("Error updating question:", error);
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

        const { error } = await supabase.from("questions").delete().eq("id", id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: "Question deleted" });
    } catch (error: unknown) {
        console.error("Error deleting question:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
