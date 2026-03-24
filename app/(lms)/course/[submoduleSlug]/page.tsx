import { CaseStudyContent } from "@/components/lms/case-study-content";
import { getQuestionsBySubmodule } from "@/lib/supabase/questions";
import { getSubmoduleBySlug } from "@/lib/supabase/modules";
import { notFound } from "next/navigation";

interface CoursePageProps {
    params: Promise<{
        submoduleSlug: string;
    }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
    const { submoduleSlug } = await params;
    let submodule;
    let questions;

    try {
        submodule = await getSubmoduleBySlug(submoduleSlug);
        questions = await getQuestionsBySubmodule(submodule.id);
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
            title={`Case Study: ${submodule.title}`}
            breadcrumb={`Registration > ${submodule.title}`}
            questions={questions}
            submoduleSlug={submodule.slug}
        />
    );
}
