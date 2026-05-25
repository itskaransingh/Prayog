import "server-only";

import { unstable_cache } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import {
    LMS_COURSES_TAG,
    LMS_QUESTIONS_TAG,
    LMS_CHAPTERS_TAG,
} from "./lms-cache-tags";
import type { Course, Chapter } from "@/lib/supabase/courses";
import type { Question } from "@/lib/supabase/questions";

const LMS_REVALIDATE_SECONDS = 300;

const getCoursesCached = unstable_cache(
    async () => {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("courses")
            .select("*")
            .eq("is_active", true)
            .eq("is_hidden", false)
            .order("created_at", { ascending: true });

        if (error) throw error;
        return data as Course[];
    },
    ["lms:courses:list"],
    { revalidate: LMS_REVALIDATE_SECONDS, tags: [LMS_COURSES_TAG] }
);

const getCourseBySlugCached = unstable_cache(
    async (slug: string) => {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("courses")
            .select("*")
            .eq("slug", slug)
            .eq("is_active", true)
            .eq("is_hidden", false)
            .single();

        if (error) throw error;
        return data as Course;
    },
    ["lms:courses:by-slug"],
    { revalidate: LMS_REVALIDATE_SECONDS, tags: [LMS_COURSES_TAG] }
);

const getCourseByIdCached = unstable_cache(
    async (id: string) => {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("courses")
            .select("*")
            .eq("id", id)
            .eq("is_active", true)
            .eq("is_hidden", false)
            .single();

        if (error) throw error;
        return data as Course;
    },
    ["lms:courses:by-id"],
    { revalidate: LMS_REVALIDATE_SECONDS, tags: [LMS_COURSES_TAG] }
);

const getChaptersCached = unstable_cache(
    async (courseId: string) => {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("chapters")
            .select("*")
            .eq("course_id", courseId)
            .eq("is_active", true)
            .order("sort_order", { ascending: true });

        if (error) throw error;
        return data as Chapter[];
    },
    ["lms:chapters:list"],
    { revalidate: LMS_REVALIDATE_SECONDS, tags: [LMS_CHAPTERS_TAG] }
);

const getChapterBySlugCached = unstable_cache(
    async (slug: string) => {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("chapters")
            .select("*")
            .eq("slug", slug)
            .eq("is_active", true)
            .single();

        if (error) throw error;
        return data as Chapter;
    },
    ["lms:chapters:by-slug"],
    { revalidate: LMS_REVALIDATE_SECONDS, tags: [LMS_CHAPTERS_TAG] }
);

const getQuestionsByChapterCached = unstable_cache(
    async (chapterId: string) => {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("questions")
            .select("*")
            .eq("chapter_id", chapterId)
            .order("created_at", { ascending: true });

        if (error) throw error;
        return data as Question[];
    },
    ["lms:questions:by-chapter"],
    { revalidate: LMS_REVALIDATE_SECONDS, tags: [LMS_QUESTIONS_TAG] }
);

export async function getCachedCourses() {
    return getCoursesCached();
}

export async function getCachedCourseBySlug(slug: string) {
    return getCourseBySlugCached(slug);
}

export async function getCachedCourseById(id: string) {
    return getCourseByIdCached(id);
}

export async function getCachedChapters(courseId: string) {
    return getChaptersCached(courseId);
}

export async function getCachedChapterBySlug(slug: string) {
    return getChapterBySlugCached(slug);
}

export async function getCachedQuestionsByChapter(chapterId: string) {
    return getQuestionsByChapterCached(chapterId);
}
