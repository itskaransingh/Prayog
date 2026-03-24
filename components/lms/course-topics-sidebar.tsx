"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

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
    const slugMatch = pathname.match(/\/course\/([^\/]+)/);
    const submoduleSlug = slugMatch ? slugMatch[1] : null;

    const [submoduleTitle, setSubmoduleTitle] = React.useState("Loading...");
    const [topics, setTopics] = React.useState<Topic[]>([]);

    React.useEffect(() => {
        const completed = localStorage.getItem("itr-registration-completed");
        if (completed === "true") {
            setIsItrCompleted(true);
        }

        if (!submoduleSlug) return;

        const fetchSidebarData = async () => {
            const supabase = createClient();

            // Fetch submodule title
            const { data: subData } = await supabase
                .from("submodules")
                .select("id, title")
                .eq("slug", submoduleSlug)
                .single();

            if (subData) {
                setSubmoduleTitle(subData.title);

                // Fetch questions for this submodule
                const { data: questions } = await supabase
                    .from("questions")
                    .select("id, title")
                    .eq("submodule_id", subData.id)
                    .order("created_at", { ascending: true });

                if (questions && questions.length > 0) {
                    const dynamicTopics: Topic[] = questions.map((q, index) => ({
                        id: String(index + 1),
                        question_id: q.id,
                        title: q.title || `Question ${index + 1}`,
                        type: "Task",
                        href: `#question-${q.id}`,
                        isActive: true
                    }));
                    setTopics(dynamicTopics);
                } else {
                    setTopics([]);
                }
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
                {topics.map((topic) => (
                    <a
                        key={topic.question_id || topic.id}
                        href={topic.href}
                        className={`course-sidebar-item ${topic.isActive ? "active" : ""}`}
                    >
                        <span
                            className={`course-sidebar-number ${topic.isActive ? "active" : ""}`}
                        >
                            {topic.id}
                        </span>
                        <div className="course-sidebar-info">
                            <span className="course-sidebar-item-title">
                                {topic.title}
                                {topic.isActive && isItrCompleted && (
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
                ))}
            </nav>

            <style jsx>{`
                .course-sidebar {
                    width: 260px;
                    min-width: 260px;
                    background: #fff;
                    border-right: 1px solid #e5e7eb;
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                    position: sticky;
                    top: 0;
                    overflow-y: auto;
                }
                .course-sidebar-header {
                    padding: 20px 20px 12px;
                    border-bottom: 1px solid #e5e7eb;
                }
                .course-sidebar-title {
                    font-size: 17px;
                    font-weight: 700;
                    color: #111827;
                    margin: 0;
                }
                .course-sidebar-section-label {
                    padding: 14px 20px 8px;
                    font-size: 12px;
                    font-weight: 500;
                    color: #6b7280;
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
                    color: #374151;
                    transition: background 0.15s;
                    cursor: pointer;
                }
                .course-sidebar-item:hover {
                    background: #f3f4f6;
                }
                .course-sidebar-item.active {
                    background: #1e40af;
                    color: #fff;
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
                    background: #f3f4f6;
                    color: #6b7280;
                    flex-shrink: 0;
                    border: 2px solid #e5e7eb;
                }
                .course-sidebar-number.active {
                    background: #fff;
                    color: #1e40af;
                    border-color: #fff;
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
                    color: #fff;
                }
                .course-sidebar-item-type {
                    font-size: 12px;
                    color: #9ca3af;
                }
                .course-sidebar-item.active .course-sidebar-item-type {
                    color: rgba(255, 255, 255, 0.7);
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
