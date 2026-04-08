import { NextRequest, NextResponse } from "next/server";

import {
    asNonEmptyString,
    asNullableString,
    asOptionalNumber,
    asOptionalStringArray,
    badRequest,
    internalServerError,
    requireAdmin,
    revalidateQuestionsTag,
} from "../simulation-route-utils";

export async function GET(request: NextRequest) {
    try {
        const { supabase, errorResponse } = await requireAdmin();
        if (errorResponse) {
            return errorResponse;
        }

        const stepId = request.nextUrl.searchParams.get("stepId");
        if (!stepId) {
            return badRequest("stepId query param is required");
        }

        const { data, error } = await supabase
            .from("simulation_fields")
            .select("*")
            .eq("step_id", stepId)
            .order("order_index", { ascending: true });

        if (error) {
            throw error;
        }

        return NextResponse.json({ fields: data ?? [] });
    } catch (error: unknown) {
        return internalServerError("Error fetching simulation fields:", error);
    }
}

export async function POST(request: Request) {
    try {
        const { supabase, errorResponse } = await requireAdmin();
        if (errorResponse) {
            return errorResponse;
        }

        const body = (await request.json()) as {
            step_id?: unknown;
            field_name?: unknown;
            field_label?: unknown;
            expected_value?: unknown;
            options?: unknown;
            order_index?: unknown;
        };

        const stepId = asNonEmptyString(body.step_id);
        const fieldName = asNonEmptyString(body.field_name);
        const fieldLabel = asNullableString(body.field_label);
        const expectedValue = asNullableString(body.expected_value);
        const options = asOptionalStringArray(body.options);
        const orderIndex = asOptionalNumber(body.order_index);

        if (!stepId) {
            return badRequest("step_id is required");
        }

        if (!fieldName) {
            return badRequest("field_name is required and must be a non-empty string");
        }

        if (body.field_label !== undefined && fieldLabel === undefined) {
            return badRequest("field_label must be a string or null");
        }

        if (body.expected_value !== undefined && expectedValue === undefined) {
            return badRequest("expected_value must be a string or null");
        }

        if (options === null) {
            return badRequest("options must be an array of strings");
        }

        if (body.order_index !== undefined && orderIndex === undefined) {
            return badRequest("order_index must be a number");
        }

        const { data, error } = await supabase
            .from("simulation_fields")
            .insert({
                step_id: stepId,
                field_name: fieldName,
                field_label: fieldLabel ?? null,
                expected_value: expectedValue ?? null,
                options,
                order_index: orderIndex,
            })
            .select("*")
            .single();

        if (error) {
            throw error;
        }

        revalidateQuestionsTag();

        return NextResponse.json({ field: data }, { status: 201 });
    } catch (error: unknown) {
        return internalServerError("Error creating simulation field:", error);
    }
}
