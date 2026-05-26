export interface Course {
    id: string;
    title: string;
    slug: string;
    course_count: number;
    icon_name: string | null;
    bg_color: string | null;
    text_color: string | null;
    is_active: boolean;
    is_hidden: boolean;
    created_at: string;
}

export interface Chapter {
    id: string;
    course_id: string;
    title: string;
    slug: string;
    task_count: number;
    progress: number | null;
    sort_order: number | null;
    is_active: boolean;
    simulator_type: string;
}
