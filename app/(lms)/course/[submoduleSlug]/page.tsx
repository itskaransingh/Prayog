import { CaseStudyContent } from "@/components/lms/case-study-content";
import {
    getCachedModuleById,
    getCachedQuestionsBySubmodule,
    getCachedSubmoduleBySlug,
} from "@/lib/supabase/lms-cache";
import type { Submodule } from "@/lib/supabase/modules";
import { notFound } from "next/navigation";

interface CoursePageProps {
    params: Promise<{
        submoduleSlug: string;
    }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
    const { submoduleSlug } = await params;
    let submodule: Submodule;
    let questions;
    let moduleSlug = "";
    let moduleTitle = "";

    try {
        submodule = await getCachedSubmoduleBySlug(submoduleSlug);

        const [questionList, parentModule] = await Promise.all([
            getCachedQuestionsBySubmodule(submodule.id),
            getCachedModuleById(submodule.module_id),
        ]);

        questions = questionList;
        moduleSlug = parentModule.slug;
        moduleTitle = parentModule.title;

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
            breadcrumbs={[
                { label: "Prayog Offerings", href: "/offerings" },
                { label: "Learning Contents", href: "/learning-contents" },
                { label: moduleTitle, href: `/learning-contents/${moduleSlug}` },
                { label: submodule.title },
            ]}
            questions={questions}
            submoduleSlug={submodule.slug}
            moduleSlug={moduleSlug}
            simulatorType={submodule.simulator_type}
        />
    );
}
