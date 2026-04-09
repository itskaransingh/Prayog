export const COURSE_TOPIC_CHANGE_EVENT = "lms:course-topic-change";
export const COURSE_STATUS_CHANGE_EVENT = "lms:course-status-change";

export interface CourseTopicChangeDetail {
    qid: string | null;
}

export interface CourseStatusChangeDetail {
    questionId: string;
}

export function dispatchCourseTopicChange(qid: string | null) {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
        new CustomEvent<CourseTopicChangeDetail>(COURSE_TOPIC_CHANGE_EVENT, {
            detail: { qid },
        }),
    );
}

export function dispatchCourseStatusChange(questionId: string) {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
        new CustomEvent<CourseStatusChangeDetail>(COURSE_STATUS_CHANGE_EVENT, {
            detail: { questionId },
        }),
    );
}
