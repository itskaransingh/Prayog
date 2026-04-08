import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { verifyAdminAccess } from "@/lib/supabase/admin-auth";
import { LMS_QUESTIONS_TAG } from "@/lib/supabase/lms-cache-tags";
import { createClient } from "@/lib/supabase/server";

export type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function requireAdmin() {
    const supabase = await createClient();
    const admin = await verifyAdminAccess(supabase);

    if (!admin) {
        return {
            errorResponse: NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            ),
            supabase,
        };
    }

    return {
        supabase,
    };
}

export function badRequest(error: string) {
    return NextResponse.json({ error }, { status: 400 });
}

export function conflict(error: string, body?: Record<string, unknown>) {
    return NextResponse.json(
        body ? { error, ...body } : { error },
        { status: 409 }
    );
}

export function notFound(error: string) {
    return NextResponse.json({ error }, { status: 404 });
}

export function internalServerError(message: string, error: unknown) {
    console.error(message, error);
    return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
    );
}

export function revalidateQuestionsTag() {
    revalidateTag(LMS_QUESTIONS_TAG, "max");
}

export function asNonEmptyString(value: unknown) {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

export function asNullableString(value: unknown) {
    if (value === null) {
        return null;
    }

    return typeof value === "string" ? value : undefined;
}

export function asOptionalNumber(value: unknown) {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function asOptionalStringArray(value: unknown) {
    if (value === undefined) {
        return undefined;
    }

    if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
        return null;
    }

    return value;
}
