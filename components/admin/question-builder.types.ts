import type { QuestionType } from "@/lib/questions/types";

export interface QuestionFormState {
    title: string;
    contentHtml: string;
    upperBodyHtml: string;
    lowerBodyHtml: string;
    hasImage: boolean;
    imageUrl: string;
    type: QuestionType;
    courseObjectives: string[];
    videoUrl: string;
    linkUrl: string;
    linkTitle: string;
    showExpectedAnswersInEvaluation: boolean;
}