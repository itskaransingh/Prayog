export const QUESTION_TYPES = ["question", "video", "document"] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export function isQuestionType(value: unknown): value is QuestionType {
    return typeof value === "string" && QUESTION_TYPES.includes(value as QuestionType);
}

export function getQuestionTypeLabel(type: QuestionType): string {
    switch (type) {
        case "video":
            return "Video";
        case "document":
            return "Document";
        case "question":
        default:
            return "Task";
    }
}

export function isTaskQuestionType(type: QuestionType | null | undefined): boolean {
    return (type ?? "question") === "question";
}
