import { createClient } from "@/lib/supabase/server";
import {
    LMS_MODULES_TAG,
    LMS_QUESTIONS_TAG,
    LMS_SUBMODULES_TAG,
} from "../../../../lib/supabase/lms-cache-tags";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

const VALID_SIMULATOR_TYPES = [
    "none",
    "classification",
    "itr_registration",
    "epan_registration",
    "journal_entry",
    "ledger",
    "trial_balance",
    "financial_statement",
] as const;

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
        const { module_id, title, slug, task_count, sort_order, is_active, simulator_type } = body;

        if (!module_id || !title || !slug) {
            return NextResponse.json({ error: "module_id, title, and slug are required" }, { status: 400 });
        }

        if (is_active !== undefined && typeof is_active !== "boolean") {
            return NextResponse.json({ error: "is_active must be a boolean" }, { status: 400 });
        }

        if (
            simulator_type !== undefined &&
            !VALID_SIMULATOR_TYPES.includes(simulator_type)
        ) {
            return NextResponse.json(
                { error: `simulator_type must be one of: ${VALID_SIMULATOR_TYPES.join(", ")}` },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from("submodules")
            .insert({
                module_id,
                title,
                slug,
                task_count: task_count ?? 0,
                sort_order,
                is_active: is_active ?? true,
                simulator_type: simulator_type ?? "none",
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Recalculate course_count for the parent module
        if (data?.module_id) {
            const { count: submoduleCount } = await supabase
                .from("submodules")
                .select("*", { count: "exact", head: true })
                .eq("module_id", data.module_id);

            await supabase
                .from("modules")
                .update({ course_count: submoduleCount ?? 0 })
                .eq("id", data.module_id);
        }

        revalidateTag(LMS_MODULES_TAG, "max");
        revalidateTag(LMS_SUBMODULES_TAG, "max");
        revalidateTag(LMS_QUESTIONS_TAG, "max");

        return NextResponse.json({ submodule: data }, { status: 201 });
    } catch (error: unknown) {
        console.error("Error creating submodule:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
