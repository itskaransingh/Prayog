"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import {
    COURSE_TOPIC_CHANGE_EVENT,
    dispatchCourseTopicChange,
    type CourseTopicChangeDetail,
} from "@/lib/lms/task-navigation";

interface Topic {
    id: string;
    question_id: string;
    title: string;
    type: string;
}

const sidebarCache = new Map<string, { title: string; topics: Topic[] }>();

export function CourseTopicsSidebar() {
    const [isItrCompleted, setIsItrCompleted] = React.useState(false);
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

        const completed = localStorage.getItem(`${submoduleSlug}-completed`);
        if (completed === "true") {
            setIsItrCompleted(true);
        } else {
            setIsItrCompleted(false);
        }

        const cached = sidebarCache.get(submoduleSlug);
        if (cached) {
            setSubmoduleTitle(cached.title);
            setTopics(cached.topics);
            return;
        }

        const fetchSidebarData = async () => {
            try {
                const supabase = createClient();

                // Fetch submodule title
                const { data: subData, error: subError } = await supabase
                    .from("submodules")
                    .select("id, title")
                    .eq("slug", submoduleSlug)
                    .eq("is_active", true)
                    .single();

                if (subError) {
                    console.error("Error fetching submodule:", subError);
                    setSubmoduleTitle("Module Not Found");
                    return;
                }

                if (subData) {
                    setSubmoduleTitle(subData.title);

                    // Fetch questions for this submodule
                    const { data: questions, error: questionsError } = await supabase
                        .from("questions")
                        .select("id, title, video_url, link_url")
                        .eq("submodule_id", subData.id)
                        .order("created_at", { ascending: true });

                    if (questionsError) {
                        console.error("Error fetching questions:", questionsError);
                        return;
                    }

                    if (questions && questions.length > 0) {
                        const dynamicTopics: Topic[] = questions.map((q, index) => {
                            let type = "Task";
                            if (q.video_url) {
                                type = "Video";
                            } else if (q.link_url) {
                                type = "Document";
                            }

                            return {
                                id: String(index + 1),
                                question_id: q.id,
                                title: q.title || `Question ${index + 1}`,
                                type,
                            };
                        });

                        sidebarCache.set(submoduleSlug, {
                            title: subData.title,
                            topics: dynamicTopics,
                        });

                        setTopics(dynamicTopics);
                    } else {
                        setTopics([]);
                    }
                }
            } catch (err) {
                console.error("Sidebar fetch failed:", err);
                setSubmoduleTitle("Error Loading");
            }
        };

        fetchSidebarData();
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
                    return (
                        <button
                            key={topic.question_id || topic.id}
                            type="button"
                            onClick={() => handleTopicSelect(topic.question_id)}
                            className={`course-sidebar-item ${isActive ? "active" : ""}`}
                        >
                            <span
                                className={`course-sidebar-number ${isActive ? "active" : ""}`}
                            >
                                {topic.id}
                            </span>
                            <div className="course-sidebar-info">
                                <span className={`course-sidebar-item-title ${isActive ? "active" : ""}`}>
                                    {topic.title}
                                    {isActive && isItrCompleted && (
                                        <span className="course-sidebar-completed-badge">
                                            Completed
                                        </span>
                                    )}
                                </span>
                                <span className={`course-sidebar-item-type ${isActive ? "active" : ""}`}>
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
                    overflow-y: auto;
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
                .course-sidebar-item.active {
                    background: #dcfce7;
                    color: #14532d;
                    border-color: #22c55e;
                    box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.18);
                }
                .course-sidebar-item.active:hover {
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
                .course-sidebar-item.active .course-sidebar-number {
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
                .course-sidebar-item-title.active {
                    color: #15803d;
                    font-weight: 700;
                }
                .course-sidebar-item-type {
                    font-size: 12px;
                    color: var(--muted-foreground);
                }
                .course-sidebar-item-type.active {
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
                :global(.dark) .course-sidebar-item.active {
                    background: rgba(34, 197, 94, 0.24);
                    color: #dcfce7;
                    border-color: rgba(74, 222, 128, 0.9);
                    box-shadow: 0 0 0 1px rgba(74, 222, 128, 0.2);
                }
                :global(.dark) .course-sidebar-item.active:hover {
                    background: rgba(34, 197, 94, 0.24);
                    color: #dcfce7;
                    border-color: rgba(74, 222, 128, 0.9);
                }
                :global(.dark) .course-sidebar-item.active .course-sidebar-number {
                    background: #22c55e;
                    color: #052e16;
                    border-color: #22c55e;
                }
                :global(.dark) .course-sidebar-item-title.active {
                    color: #86efac;
                }
                :global(.dark) .course-sidebar-item-type.active {
                    color: #bbf7d0;
                }
            `}</style>
        </aside>
    );
}
