import { CaseStudyContent } from "@/components/lms/case-study-content";
import {
    getCachedCourseById,
    getCachedQuestionsByChapter,
    getCachedChapterBySlug,
} from "@/lib/supabase/lms-cache";
import type { Chapter } from "@/lib/supabase/courses";
import { notFound } from "next/navigation";

interface CoursePageProps {
    params: Promise<{
        submoduleSlug: string;
    }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
    const { submoduleSlug } = await params;
    let chapter: Chapter;
    let questions;
    let courseSlug = "";
    let courseTitle = "";

    try {
        chapter = await getCachedChapterBySlug(submoduleSlug);

        const [questionList, parentCourse] = await Promise.all([
            getCachedQuestionsByChapter(chapter.id),
            getCachedCourseById(chapter.course_id),
        ]);

        questions = questionList;
        courseSlug = parentCourse.slug;
        courseTitle = parentCourse.title;

    } catch (error) {
        const code = typeof error === "object" && error !== null && "code" in error
            ? String(error.code)
            : "";

        if (code === "PGRST116") {
            notFound();
        }

        throw error;
    }

    return (
        <CaseStudyContent
            title={`Case Study: ${chapter.title}`}
            breadcrumbs={[
                { label: "Home", href: "/" },
                { label: "Learning Contents", href: "/learning-contents" },
                { label: courseTitle, href: `/learning-contents/${courseSlug}` },
                { label: chapter.title },
            ]}
            questions={questions}
            submoduleSlug={submoduleSlug}
            moduleSlug={courseSlug}
        />
    );
}
