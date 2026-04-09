"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
    COURSE_STATUS_CHANGE_EVENT,
    COURSE_TOPIC_CHANGE_EVENT,
    dispatchCourseTopicChange,
    type CourseTopicChangeDetail,
} from "@/lib/lms/task-navigation";

interface Topic {
    id: string;
    question_id: string;
    title: string;
    type: string;
    attempted: boolean;
    completed: boolean;
    taskNumber: number | null;
}

export function CourseTopicsSidebar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const qid = searchParams.get("qid");
    const slugMatch = pathname.match(/\/course\/([^\/]+)/);
    const submoduleSlug = slugMatch ? slugMatch[1] : null;

    const [submoduleTitle, setSubmoduleTitle] = React.useState("Loading...");
    const [topics, setTopics] = React.useState<Topic[]>([]);
    const [activeQid, setActiveQid] = React.useState<string | null>(qid);

    React.useEffect(() => {
        setActiveQid(qid);
    }, [qid]);

    React.useEffect(() => {
        const handlePopState = () => {
            const params = new URL(window.location.href).searchParams;
            setActiveQid(params.get("qid"));
        };

        const handleTopicChange = (event: Event) => {
            const customEvent = event as CustomEvent<CourseTopicChangeDetail>;
            setActiveQid(customEvent.detail?.qid ?? null);
        };

        window.addEventListener("popstate", handlePopState);
        window.addEventListener(COURSE_TOPIC_CHANGE_EVENT, handleTopicChange as EventListener);

        return () => {
            window.removeEventListener("popstate", handlePopState);
            window.removeEventListener(COURSE_TOPIC_CHANGE_EVENT, handleTopicChange as EventListener);
        };
    }, []);

    const handleTopicSelect = React.useCallback((questionId: string) => {
        if (typeof window === "undefined") return;

        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.get("qid") === questionId) {
            return;
        }

        currentUrl.searchParams.set("qid", questionId);
        const query = currentUrl.searchParams.toString();
        const nextUrl = query ? `${currentUrl.pathname}?${query}` : currentUrl.pathname;

        window.history.pushState({}, "", nextUrl);
        setActiveQid(questionId);
        dispatchCourseTopicChange(questionId);
    }, []);

    React.useEffect(() => {
        if (!submoduleSlug) return;

        const fetchSidebarData = async () => {
            try {
                const response = await fetch(
                    `/api/lms/submodules/${submoduleSlug}/question-status`,
                    { cache: "no-store", credentials: "include" },
                );
                const payload = await response.json();

                if (!response.ok) {
                    throw new Error(payload.error || "Failed to load sidebar data");
                }

                const nextTitle = payload.submodule?.title || "Module Not Found";
                const nextTopics: Topic[] = (payload.questions ?? []).map((question: {
                    id: string;
                    order: number;
                    taskNumber: number | null;
                    title: string;
                    type: string;
                    attempted: boolean;
                    completed: boolean;
                }) => ({
                    id:
                        typeof question.taskNumber === "number"
                            ? String(question.taskNumber)
                            : question.type === "Video"
                            ? "V"
                            : "D",
                    question_id: question.id,
                    taskNumber: question.taskNumber,
                    title: question.title,
                    type: question.type,
                    attempted: Boolean(question.attempted),
                    completed: Boolean(question.completed),
                }));

                setSubmoduleTitle(nextTitle);
                setTopics(nextTopics);
            } catch (err) {
                console.error("Sidebar fetch failed:", err);
                setSubmoduleTitle("Error Loading");
            }
        };

        void fetchSidebarData();
        window.addEventListener("focus", fetchSidebarData);
        window.addEventListener(
            COURSE_STATUS_CHANGE_EVENT,
            fetchSidebarData as EventListener,
        );

        return () => {
            window.removeEventListener("focus", fetchSidebarData);
            window.removeEventListener(
                COURSE_STATUS_CHANGE_EVENT,
                fetchSidebarData as EventListener,
            );
        };
    }, [submoduleSlug]);

    return (
        <aside className="course-sidebar">
            <div className="course-sidebar-header">
                <h2 className="course-sidebar-title">{submoduleTitle}</h2>
            </div>

            <div className="course-sidebar-section-label">Course Topics</div>

            <nav className="course-sidebar-nav">
                {topics.map((topic, index) => {
                    const isActive = activeQid ? activeQid === topic.question_id : index === 0;
                    const itemStateClassName = isActive
                        ? "current"
                        : topic.completed
                        ? "completed"
                        : "";
                    return (
                        <button
                            key={topic.question_id || topic.id}
                            type="button"
                            onClick={() => handleTopicSelect(topic.question_id)}
                            className={`course-sidebar-item ${itemStateClassName}`}
                        >
                            <span
                                className={`course-sidebar-number ${itemStateClassName}`}
                            >
                                {topic.id}
                            </span>
                            <div className="course-sidebar-info">
                                <span className={`course-sidebar-item-title ${itemStateClassName}`}>
                                    {topic.title}
                                    {!isActive && topic.completed && (
                                        <span className="course-sidebar-completed-badge">
                                            Completed
                                        </span>
                                    )}
                                </span>
                                <span className={`course-sidebar-item-type ${itemStateClassName}`}>
                                    {topic.type}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </nav>

            <style jsx>{`
                .course-sidebar {
                    width: 260px;
                    min-width: 260px;
                    background: var(--background);
                    border-right: 1px solid var(--border);
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                    position: sticky;
                    top: 0;
                    overflow: hidden;
                }
                .course-sidebar-header {
                    padding: 20px 20px 12px;
                    border-bottom: 1px solid var(--border);
                }
                .course-sidebar-title {
                    font-size: 17px;
                    font-weight: 700;
                    color: var(--foreground);
                    margin: 0;
                    line-height: 1.2;
                }
                .course-sidebar-section-label {
                    padding: 14px 20px 8px;
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--muted-foreground);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .course-sidebar-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding: 4px 10px;
                    padding-bottom: 124px;
                    flex: 1;
                    min-height: 0;
                    overflow-y: auto;
                }
                .course-sidebar-item {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 12px 14px;
                    border-radius: 10px;
                    text-decoration: none;
                    text-align: left;
                    font: inherit;
                    color: var(--foreground);
                    transition: background 0.15s, border-color 0.15s, box-shadow 0.15s, transform 0.15s;
                    cursor: pointer;
                    border: 1px solid var(--border);
                    background: var(--card);
                    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
                    appearance: none;
                }
                .course-sidebar-item:hover {
                    background: color-mix(in srgb, var(--accent) 75%, var(--card) 25%);
                    color: var(--accent-foreground);
                    border-color: color-mix(in srgb, var(--primary) 22%, var(--border) 78%);
                    transform: translateY(-1px);
                }
                .course-sidebar-item.current {
                    background: #fef3c7;
                    color: #92400e;
                    border-color: #f59e0b;
                    box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.16);
                }
                .course-sidebar-item.current:hover {
                    background: #fef3c7;
                    color: #92400e;
                    border-color: #f59e0b;
                }
                .course-sidebar-item.completed {
                    background: #dcfce7;
                    color: #14532d;
                    border-color: #22c55e;
                    box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.18);
                }
                .course-sidebar-item.completed:hover {
                    background: #dcfce7;
                    color: #14532d;
                    border-color: #22c55e;
                }
                .course-sidebar-number {
                    width: 34px;
                    height: 34px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    font-size: 14px;
                    font-weight: 600;
                    background: var(--muted);
                    color: var(--muted-foreground);
                    flex-shrink: 0;
                    border: 2px solid var(--border);
                }
                .course-sidebar-number.current {
                    background: #f59e0b;
                    color: #fffbeb;
                    border-color: #f59e0b;
                }
                .course-sidebar-number.completed {
                    background: #16a34a;
                    color: #f0fdf4;
                    border-color: #16a34a;
                }
                .course-sidebar-info {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 0;
                }
                .course-sidebar-item-title {
                    font-size: 14px;
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .course-sidebar-item-title.current {
                    color: #b45309;
                    font-weight: 700;
                }
                .course-sidebar-item-title.completed {
                    color: #15803d;
                    font-weight: 700;
                }
                .course-sidebar-item-type {
                    font-size: 12px;
                    color: var(--muted-foreground);
                }
                .course-sidebar-item-type.current {
                    color: #d97706;
                    font-weight: 600;
                    opacity: 1;
                }
                .course-sidebar-item-type.completed {
                    color: #16a34a;
                    font-weight: 600;
                    opacity: 1;
                }
                .course-sidebar-completed-badge {
                    margin-left: 6px;
                    display: inline-flex;
                    align-items: center;
                    border-radius: 9999px;
                    background: rgba(34, 197, 94, 0.2);
                    padding: 1px 8px;
                    font-size: 11px;
                    font-weight: 500;
                    color: #22c55e;
                }
                :global(.dark) .course-sidebar-item.current {
                    background: rgba(245, 158, 11, 0.22);
                    color: #fef3c7;
                    border-color: rgba(251, 191, 36, 0.88);
                    box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.18);
                }
                :global(.dark) .course-sidebar-item.current:hover {
                    background: rgba(245, 158, 11, 0.22);
                    color: #fef3c7;
                    border-color: rgba(251, 191, 36, 0.88);
                }
                :global(.dark) .course-sidebar-item.completed {
                    background: rgba(34, 197, 94, 0.24);
                    color: #dcfce7;
                    border-color: rgba(74, 222, 128, 0.9);
                    box-shadow: 0 0 0 1px rgba(74, 222, 128, 0.2);
                }
                :global(.dark) .course-sidebar-item.completed:hover {
                    background: rgba(34, 197, 94, 0.24);
                    color: #dcfce7;
                    border-color: rgba(74, 222, 128, 0.9);
                }
                :global(.dark) .course-sidebar-number.current {
                    background: #f59e0b;
                    color: #451a03;
                    border-color: #f59e0b;
                }
                :global(.dark) .course-sidebar-number.completed {
                    background: #22c55e;
                    color: #052e16;
                    border-color: #22c55e;
                }
                :global(.dark) .course-sidebar-item-title.current {
                    color: #fde68a;
                }
                :global(.dark) .course-sidebar-item-title.completed {
                    color: #86efac;
                }
                :global(.dark) .course-sidebar-item-type.current {
                    color: #fcd34d;
                }
                :global(.dark) .course-sidebar-item-type.completed {
                    color: #bbf7d0;
                }
            `}</style>
        </aside>
    );
}
