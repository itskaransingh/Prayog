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
import {
    isRegistrationSimulatorType,
    normalizeSimulationFieldDefinitions,
    resolveRegistrationFieldDefinitions,
    type SimulatorType,
} from "@/lib/simulation/answer-field-generator";

export async function GET(request: NextRequest) {
    try {
        const { supabase, errorResponse } = await requireAdmin();
        if (errorResponse) {
            return errorResponse;
        }

        const stepId = request.nextUrl.searchParams.get("stepId");
        const simulatorType = request.nextUrl.searchParams.get(
            "simulatorType",
        ) as SimulatorType | null;

        if (stepId) {
            const { data, error } = await supabase
                .from("simulation_fields")
                .select("*")
                .eq("step_id", stepId)
                .order("order_index", { ascending: true });

            if (error) {
                throw error;
            }

            return NextResponse.json({ fields: data ?? [] });
        }

        if (!simulatorType) {
            return badRequest("stepId or simulatorType query param is required");
        }

        if (!isRegistrationSimulatorType(simulatorType)) {
            return NextResponse.json({
                definitions: [],
                simulatorType,
                usedFallback: false,
            });
        }

        const { data, error } = await supabase
            .from("simulation_field_definitions")
            .select(
                "id, simulator_type, field_name, field_label, field_group, input_type, sort_order, is_active, help_text",
            )
            .eq("simulator_type", simulatorType)
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
            .order("field_name", { ascending: true });

        if (error) {
            throw error;
        }

        const normalizedDefinitions = normalizeSimulationFieldDefinitions(data ?? []);
        const definitions = resolveRegistrationFieldDefinitions(
            simulatorType,
            normalizedDefinitions,
        );

        return NextResponse.json({
            definitions,
            simulatorType,
            usedFallback: normalizedDefinitions.length === 0,
        });
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
            field_type?: unknown;
            field_label?: unknown;
            expected_value?: unknown;
            options?: unknown;
            order_index?: unknown;
        };

        const stepId = asNonEmptyString(body.step_id);
        const fieldName = asNonEmptyString(body.field_name);
        const fieldType = asNullableString(body.field_type);
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

        if (body.field_type !== undefined && fieldType === undefined) {
            return badRequest("field_type must be a string or null");
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
                field_type: fieldType ?? "text",
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
