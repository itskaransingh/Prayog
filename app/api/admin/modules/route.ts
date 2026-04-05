import { createClient } from "@/lib/supabase/server";
import {
    LMS_MODULES_TAG,
    LMS_QUESTIONS_TAG,
    LMS_SUBMODULES_TAG,
} from "../../../../lib/supabase/lms-cache-tags";
import { revalidateTag } from "next/cache";
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
        const { title, slug, course_count, icon_name, bg_color, text_color, is_active } = body;

        if (!title || !slug) {
            return NextResponse.json({ error: "title and slug are required" }, { status: 400 });
        }

        if (is_active !== undefined && typeof is_active !== "boolean") {
            return NextResponse.json({ error: "is_active must be a boolean" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("modules")
            .insert({
                title,
                slug,
                course_count,
                icon_name,
                bg_color,
                text_color,
                is_active: is_active ?? true,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        revalidateTag(LMS_MODULES_TAG, "max");
        revalidateTag(LMS_SUBMODULES_TAG, "max");
        revalidateTag(LMS_QUESTIONS_TAG, "max");

        return NextResponse.json({ module: data }, { status: 201 });
    } catch (error: unknown) {
        console.error("Error creating module:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
