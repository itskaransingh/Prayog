import { NextResponse } from "next/server";

import {
    asNonEmptyString,
    asNullableString,
    asOptionalNumber,
    asOptionalStringArray,
    badRequest,
    internalServerError,
    notFound,
    requireAdmin,
    revalidateQuestionsTag,
} from "../../simulation-route-utils";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { supabase, errorResponse } = await requireAdmin();
        if (errorResponse) {
            return errorResponse;
        }

        const body = (await request.json()) as {
            step_id?: unknown;
            field_name?: unknown;
            field_type?: unknown;
            field_label?: unknown;
            expected_value?: unknown;
            options?: unknown;
            order_index?: unknown;
        };
        const updateData: {
            step_id?: string;
            field_name?: string;
            field_type?: string | null;
            field_label?: string | null;
            expected_value?: string | null;
            options?: string[];
            order_index?: number;
        } = {};

        if (body.step_id !== undefined) {
            const stepId = asNonEmptyString(body.step_id);
            if (!stepId) {
                return badRequest("step_id must be a non-empty string");
            }
            updateData.step_id = stepId;
        }

        if (body.field_name !== undefined) {
            const fieldName = asNonEmptyString(body.field_name);
            if (!fieldName) {
                return badRequest("field_name must be a non-empty string");
            }
            updateData.field_name = fieldName;
        }

        if (body.field_type !== undefined) {
            const fieldType = asNullableString(body.field_type);
            if (fieldType === undefined) {
                return badRequest("field_type must be a string or null");
            }
            updateData.field_type = fieldType;
        }

        if (body.field_label !== undefined) {
            const fieldLabel = asNullableString(body.field_label);
            if (fieldLabel === undefined) {
                return badRequest("field_label must be a string or null");
            }
            updateData.field_label = fieldLabel;
        }

        if (body.expected_value !== undefined) {
            const expectedValue = asNullableString(body.expected_value);
            if (expectedValue === undefined) {
                return badRequest("expected_value must be a string or null");
            }
            updateData.expected_value = expectedValue;
        }

        if (body.options !== undefined) {
            const options = asOptionalStringArray(body.options);
            if (options === null) {
                return badRequest("options must be an array of strings");
            }
            updateData.options = options;
        }

        if (body.order_index !== undefined) {
            const orderIndex = asOptionalNumber(body.order_index);
            if (orderIndex === undefined) {
                return badRequest("order_index must be a number");
            }
            updateData.order_index = orderIndex;
        }

        if (Object.keys(updateData).length === 0) {
            return badRequest("No fields to update");
        }

        const { data, error } = await supabase
            .from("simulation_fields")
            .update(updateData)
            .eq("id", id)
            .select("*")
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return notFound("Simulation field not found");
        }

        revalidateQuestionsTag();

        return NextResponse.json({ field: data });
    } catch (error: unknown) {
        return internalServerError("Error updating simulation field:", error);
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { supabase, errorResponse } = await requireAdmin();
        if (errorResponse) {
            return errorResponse;
        }

        const { data, error } = await supabase
            .from("simulation_fields")
            .delete()
            .eq("id", id)
            .select("*")
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return notFound("Simulation field not found");
        }

        revalidateQuestionsTag();

        return NextResponse.json({ field: data });
    } catch (error: unknown) {
        return internalServerError("Error deleting simulation field:", error);
    }
}
