import "server-only";

import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import {
    LMS_MODULES_TAG,
    LMS_QUESTIONS_TAG,
    LMS_SUBMODULES_TAG,
} from "./lms-cache-tags";
import type { Module, Submodule } from "@/lib/supabase/modules";
import type { Question } from "@/lib/supabase/questions";

const LMS_REVALIDATE_SECONDS = 300;

const getModulesCached = unstable_cache(
    async () => {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("modules")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: true });

        if (error) throw error;
        return data as Module[];
    },
    ["lms:modules:list"],
    { revalidate: LMS_REVALIDATE_SECONDS, tags: [LMS_MODULES_TAG] }
);

const getModuleBySlugCached = unstable_cache(
    async (slug: string) => {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("modules")
            .select("*")
            .eq("slug", slug)
            .eq("is_active", true)
            .single();

        if (error) throw error;
        return data as Module;
    },
    ["lms:modules:by-slug"],
    { revalidate: LMS_REVALIDATE_SECONDS, tags: [LMS_MODULES_TAG] }
);

const getModuleByIdCached = unstable_cache(
    async (id: string) => {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("modules")
            .select("*")
            .eq("id", id)
            .eq("is_active", true)
            .single();

        if (error) throw error;
        return data as Module;
    },
    ["lms:modules:by-id"],
    { revalidate: LMS_REVALIDATE_SECONDS, tags: [LMS_MODULES_TAG] }
);

const getSubmodulesCached = unstable_cache(
    async (moduleId: string) => {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("submodules")
            .select("*")
            .eq("module_id", moduleId)
            .eq("is_active", true)
            .order("sort_order", { ascending: true });

        if (error) throw error;
        return data as Submodule[];
    },
    ["lms:submodules:list"],
    { revalidate: LMS_REVALIDATE_SECONDS, tags: [LMS_SUBMODULES_TAG] }
);

const getSubmoduleBySlugCached = unstable_cache(
    async (slug: string) => {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("submodules")
            .select("*")
            .eq("slug", slug)
            .eq("is_active", true)
            .single();

        if (error) throw error;
        return data as Submodule;
    },
    ["lms:submodules:by-slug"],
    { revalidate: LMS_REVALIDATE_SECONDS, tags: [LMS_SUBMODULES_TAG] }
);

const getQuestionsBySubmoduleCached = unstable_cache(
    async (submoduleId: string) => {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("questions")
            .select("*")
            .eq("submodule_id", submoduleId)
            .order("created_at", { ascending: true });

        if (error) throw error;
        return data as Question[];
    },
    ["lms:questions:by-submodule"],
    { revalidate: LMS_REVALIDATE_SECONDS, tags: [LMS_QUESTIONS_TAG] }
);

export async function getCachedModules() {
    return getModulesCached();
}

export async function getCachedModuleBySlug(slug: string) {
    return getModuleBySlugCached(slug);
}

export async function getCachedModuleById(id: string) {
    return getModuleByIdCached(id);
}

export async function getCachedSubmodules(moduleId: string) {
    return getSubmodulesCached(moduleId);
}

export async function getCachedSubmoduleBySlug(slug: string) {
    return getSubmoduleBySlugCached(slug);
}

export async function getCachedQuestionsBySubmodule(submoduleId: string) {
    return getQuestionsBySubmoduleCached(submoduleId);
}
