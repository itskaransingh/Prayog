"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

interface Topic {
    id: string;
    question_id: string;
    title: string;
    type: string;
    href: string;
    isActive: boolean;
}

export function CourseTopicsSidebar() {
    const [isItrCompleted, setIsItrCompleted] = React.useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const qid = searchParams.get("qid");
    const slugMatch = pathname.match(/\/course\/([^\/]+)/);
    const submoduleSlug = slugMatch ? slugMatch[1] : null;

    const [submoduleTitle, setSubmoduleTitle] = React.useState("Loading...");
    const [topics, setTopics] = React.useState<Topic[]>([]);

    React.useEffect(() => {
        if (!submoduleSlug) return;
        const completed = localStorage.getItem(`${submoduleSlug}-completed`);
        if (completed === "true") {
            setIsItrCompleted(true);
        } else {
            setIsItrCompleted(false);
        }

        const fetchSidebarData = async () => {
            try {
                const supabase = createClient();

                // Fetch submodule title
                const { data: subData, error: subError } = await supabase
                    .from("submodules")
                    .select("id, title")
                    .eq("slug", submoduleSlug)
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
                        .select("id, title")
                        .eq("submodule_id", subData.id)
                        .order("created_at", { ascending: true });

                    if (questionsError) {
                        console.error("Error fetching questions:", questionsError);
                        return;
                    }

                    if (questions && questions.length > 0) {
                        const dynamicTopics: Topic[] = questions.map((q, index) => ({
                            id: String(index + 1),
                            question_id: q.id,
                            title: q.title || `Question ${index + 1}`,
                            type: "Task",
                            href: `?qid=${q.id}`,
                            isActive: false
                        }));
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
                    const isActive = qid ? qid === topic.question_id : index === 0;
                    return (
                        <a
                            key={topic.question_id || topic.id}
                            href={topic.href}
                            className={`course-sidebar-item ${isActive ? "active" : ""}`}
                        >
                            <span
                                className={`course-sidebar-number ${isActive ? "active" : ""}`}
                            >
                                {topic.id}
                            </span>
                            <div className="course-sidebar-info">
                                <span className="course-sidebar-item-title">
                                    {topic.title}
                                    {isActive && isItrCompleted && (
                                        <span className="course-sidebar-completed-badge">
                                            Completed
                                        </span>
                                    )}
                                </span>
                                <span className="course-sidebar-item-type">
                                    {topic.type}
                                </span>
                            </div>
                        </a>
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
                    gap: 2px;
                    padding: 4px 10px;
                }
                .course-sidebar-item {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 12px 14px;
                    border-radius: 10px;
                    text-decoration: none;
                    color: var(--foreground);
                    transition: background 0.15s;
                    cursor: pointer;
                }
                .course-sidebar-item:hover {
                    background: var(--accent);
                    color: var(--accent-foreground);
                }
                .course-sidebar-item.active {
                    background: var(--accent);
                    color: var(--accent-foreground);
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
                    background: var(--background);
                    color: var(--foreground);
                    border-color: var(--border);
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
                .course-sidebar-item.active .course-sidebar-item-title {
                    color: var(--foreground);
                }
                .course-sidebar-item-type {
                    font-size: 12px;
                    color: var(--muted-foreground);
                }
                .course-sidebar-item.active .course-sidebar-item-type {
                    color: var(--muted-foreground);
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
            `}</style>
        </aside>
    );
}
