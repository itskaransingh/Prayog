import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

export async function GET() {
    try {
        const supabase = await createClient();
        const admin = await verifyAdmin(supabase);
        if (!admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { data, error } = await supabase
            .from("modules")
            .select("*, submodules(count)")
            .order("created_at", { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ modules: data });
    } catch (error: unknown) {
        console.error("Error fetching modules:", error);
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
        const { title, slug, course_count, icon_name, bg_color, text_color } = body;

        if (!title || !slug) {
            return NextResponse.json({ error: "title and slug are required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("modules")
            .insert({ title, slug, course_count, icon_name, bg_color, text_color })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ module: data }, { status: 201 });
    } catch (error: unknown) {
        console.error("Error creating module:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
