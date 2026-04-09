import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function deriveFullName(email: string) {
    return email.split("@")[0]?.trim() || email.trim();
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        );

        // 1. Check if the requester is authenticated
        const { data: { user: requester }, error: authError } = await supabase.auth.getUser();
        if (authError || !requester) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Check if the requester is an admin
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", requester.id)
            .single();

        if (profileError || !profile || profile.role !== "admin") {
            return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
        }

        // 3. Parse request body
        const { email, password, role, fullName } = await request.json();

        if (!email || !password || !role) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const normalizedFullName = (typeof fullName === "string" ? fullName.trim() : "") || deriveFullName(email);

        // 4. Create user using Admin Client
        const supabaseAdmin = createAdminClient();
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (createError) {
            return NextResponse.json({ error: createError.message }, { status: 500 });
        }

        if (!newUser.user) {
            return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
        }

        // 5. Insert into profiles table
        const { error: insertError } = await supabaseAdmin
            .from("profiles")
            .insert({
                id: newUser.user.id,
                email: newUser.user.email,
                full_name: normalizedFullName,
                role: role,
            });

        if (insertError) {
            // Note: In a production app, we might want to delete the auth user if this fails
            // but for now we'll just report the error.
            return NextResponse.json({ error: `User created but profile insertion failed: ${insertError.message}` }, { status: 500 });
        }

        return NextResponse.json({ message: "User created successfully", user: newUser.user });
    } catch (error: unknown) {
        console.error("User creation error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
