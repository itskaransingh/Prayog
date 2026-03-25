import { CaseStudyContent } from "@/components/lms/case-study-content";
import { getQuestionsBySubmodule } from "@/lib/supabase/questions";
import { getSubmoduleBySlug, getSubmodules, getModuleById, type Submodule } from "@/lib/supabase/modules";
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
    let prevSubmodule: { title: string; slug: string } | null = null;
    let nextSubmodule: { title: string; slug: string } | null = null;
    let moduleSlug = "";

    try {
        submodule = await getSubmoduleBySlug(submoduleSlug);
        questions = await getQuestionsBySubmodule(submodule.id);
        
        // Fetch all submodules to find next/prev
        const allSubmodules = await getSubmodules(submodule.module_id);
        const currentIndex = allSubmodules.findIndex(s => s.id === submodule.id);
        
        if (currentIndex > 0) {
            const prev = allSubmodules[currentIndex - 1];
            prevSubmodule = { title: prev.title, slug: prev.slug };
        }
        
        if (currentIndex < allSubmodules.length - 1) {
            const next = allSubmodules[currentIndex + 1];
            nextSubmodule = { title: next.title, slug: next.slug };
        }

        // Get module slug for URL generation if needed
        const parentModule = await getModuleById(submodule.module_id);
        moduleSlug = parentModule.slug;

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
            prevSubmodule={prevSubmodule}
            nextSubmodule={nextSubmodule}
            moduleSlug={moduleSlug}
        />
    );
}
