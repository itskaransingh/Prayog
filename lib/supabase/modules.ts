import { createClient } from "@/lib/supabase/server";

// ─── Types ───────────────────────────────────────────────────────────

export interface Module {
    id: string;
    title: string;
    slug: string;
    is_active: boolean;
    course_count: number;
    icon_name: string;
    bg_color: string;
    text_color: string;
    progress: number;
    created_at: string;
    updated_at: string;
}

export interface Submodule {
    id: string;
    module_id: string;
    title: string;
    slug: string;
    simulator_type:
        | "itr_registration"
        | "epan_registration"
        | "classification"
        | "journal_entry"
        | "ledger"
        | "trial_balance"
        | "financial_statement"
        | "none"
        | null;
    is_active: boolean;
    task_count: number;
    progress: number;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export type ModuleInsert = Pick<Module, "title" | "slug"> &
    Partial<
        Pick<
            Module,
            "course_count" | "icon_name" | "bg_color" | "text_color" | "progress" | "is_active"
        >
    >;

export type ModuleUpdate = Partial<Omit<Module, "id" | "created_at" | "updated_at">>;

export type SubmoduleInsert = Pick<Submodule, "module_id" | "title" | "slug"> &
    Partial<
        Pick<
            Submodule,
            "task_count" | "progress" | "sort_order" | "is_active" | "simulator_type"
        >
    >;

export type SubmoduleUpdate = Partial<Omit<Submodule, "id" | "module_id" | "created_at" | "updated_at">>;

// ─── Modules ─────────────────────────────────────────────────────────

export async function getModules() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("modules")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });
    if (error) throw error;
    return data as Module[];
}

export async function getModuleBySlug(slug: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("modules")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
    if (error) throw error;
    return data as Module;
}

export async function getModuleById(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("modules")
        .select("*")
        .eq("id", id)
        .eq("is_active", true)
        .single();
    if (error) throw error;
    return data as Module;
}

export async function createModule(moduleData: ModuleInsert) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("modules")
        .insert(moduleData)
        .select()
        .single();
    if (error) throw error;
    return data as Module;
}

export async function updateModule(id: string, moduleData: ModuleUpdate) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("modules")
        .update(moduleData)
        .eq("id", id)
        .select()
        .single();
    if (error) throw error;
    return data as Module;
}

export async function deleteModule(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("modules")
        .delete()
        .eq("id", id);
    if (error) throw error;
}

// ─── Submodules ──────────────────────────────────────────────────────

export async function getSubmodules(moduleId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("submodules")
        .select("*")
        .eq("module_id", moduleId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
    if (error) throw error;
    return data as Submodule[];
}

export async function getSubmoduleBySlug(slug: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("submodules")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
    if (error) throw error;
    return data as Submodule;
}

export async function createSubmodule(submoduleData: SubmoduleInsert) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("submodules")
        .insert(submoduleData)
        .select()
        .single();
    if (error) throw error;
    return data as Submodule;
}

export async function updateSubmodule(id: string, submoduleData: SubmoduleUpdate) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("submodules")
        .update(submoduleData)
        .eq("id", id)
        .select()
        .single();
    if (error) throw error;
    return data as Submodule;
}

export async function deleteSubmodule(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("submodules")
        .delete()
        .eq("id", id);
    if (error) throw error;
}
