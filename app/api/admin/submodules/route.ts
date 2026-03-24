import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (!profile || profile.role !== "admin") return null;
    return user;
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const admin = await verifyAdmin(supabase);
        if (!admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const moduleId = request.nextUrl.searchParams.get("moduleId");
        if (!moduleId) {
            return NextResponse.json({ error: "moduleId query param is required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("submodules")
            .select("*")
            .eq("module_id", moduleId)
            .order("sort_order", { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ submodules: data });
    } catch (error: unknown) {
        console.error("Error fetching submodules:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const admin = await verifyAdmin(supabase);
        if (!admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { module_id, title, slug, task_count, sort_order } = body;

        if (!module_id || !title || !slug) {
            return NextResponse.json({ error: "module_id, title, and slug are required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("submodules")
            .insert({ module_id, title, slug, task_count, sort_order })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ submodule: data }, { status: 201 });
    } catch (error: unknown) {
        console.error("Error creating submodule:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
