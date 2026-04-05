export const COURSE_TOPIC_CHANGE_EVENT = "lms:course-topic-change";

export interface CourseTopicChangeDetail {
    qid: string | null;
}

export function dispatchCourseTopicChange(qid: string | null) {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
        new CustomEvent<CourseTopicChangeDetail>(COURSE_TOPIC_CHANGE_EVENT, {
            detail: { qid },
        }),
    );
}
