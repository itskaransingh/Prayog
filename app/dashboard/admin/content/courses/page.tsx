"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    GripVertical,
    ChevronDown,
    ChevronRight,
    BookOpen,
    ArrowLeft,
    Loader2,
    X,
    Save,
    Layout,
    Calculator,
    FileText,
    Briefcase,
    Landmark,
    Scale,
    GraduationCap,
    Gavel,
    Building,
    Receipt,
    Coins,
    PiggyBank
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────

interface Course {
    id: string;
    title: string;
    slug: string;
    is_active: boolean;
    is_hidden: boolean;
    course_count: number;
    icon_name: string;
    bg_color: string;
    text_color: string;
    progress: number;
    chapters?: { count: number }[];
}

interface Chapter {
    id: string;
    course_id: string;
    title: string;
    slug: string;
    simulator_type:
        | "none"
        | "classification"
        | "itr_registration"
        | "epan_registration"
        | "journal_entry"
        | "ledger"
        | "trial_balance"
        | "financial_statement"
        | "gstf-simulation"
        | null;
    is_active: boolean;
    task_count: number;
    progress: number;
    sort_order: number;
}

interface CourseFormData {
    title: string;
    slug: string;
    icon_name: string;
    bg_color: string;
    text_color: string;
    course_count: number;
    is_active: boolean;
    is_hidden: boolean;
}

interface ChapterFormData {
    title: string;
    slug: string;
    simulator_type:
        | "none"
        | "classification"
        | "itr_registration"
        | "epan_registration"
        | "journal_entry"
        | "ledger"
        | "trial_balance"
        | "financial_statement"
        | "gstf-simulation";
    task_count: number;
    sort_order: number;
    is_active: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

const ICON_OPTIONS = [
    "Calculator", "FileText", "Briefcase", "Landmark", "Scale", "BookOpen",
    "GraduationCap", "Gavel", "Building", "Receipt", "Coins", "PiggyBank",
];

const COLOR_OPTIONS = [
    { label: "Blue", bg: "bg-blue-50", text: "text-blue-600" },
    { label: "Emerald", bg: "bg-emerald-50", text: "text-emerald-600" },
    { label: "Amber", bg: "bg-amber-50", text: "text-amber-600" },
    { label: "Purple", bg: "bg-purple-50", text: "text-purple-600" },
    { label: "Rose", bg: "bg-rose-50", text: "text-rose-600" },
    { label: "Slate", bg: "bg-slate-50", text: "text-slate-600" },
    { label: "Indigo", bg: "bg-indigo-50", text: "text-indigo-600" },
    { label: "Teal", bg: "bg-teal-50", text: "text-teal-600" },
];

function isColorCombinationSafe(bg: string, text: string): boolean {
    const lightBackgrounds = ["bg-blue-50", "bg-emerald-50", "bg-amber-50", "bg-purple-50", "bg-rose-50", "bg-slate-50", "bg-indigo-50", "bg-teal-50"];
    return lightBackgrounds.includes(bg) && text.includes("-");
}

function safeBgText(bg: string, text: string): { bg: string; text: string } {
    if (!isColorCombinationSafe(bg, text)) {
        return { bg: "bg-slate-100", text: "text-slate-900" };
    }
    return { bg, text };
}

const IconMap: Record<string, React.ElementType> = {
    Calculator, FileText, Briefcase, Landmark, Scale, BookOpen,
    GraduationCap, Gavel, Building, Receipt, Coins, PiggyBank
};

const emptyCourseForm: CourseFormData = {
    title: "",
    slug: "",
    icon_name: "BookOpen",
    bg_color: "bg-blue-50",
    text_color: "text-blue-600",
    course_count: 0,
    is_active: true,
    is_hidden: false,
};

const emptyChapterForm: ChapterFormData = {
    title: "",
    slug: "",
    simulator_type: "none",
    task_count: 0,
    sort_order: 0,
    is_active: true,
};

const SIMULATOR_TYPE_OPTIONS: Array<{
    value: ChapterFormData["simulator_type"];
    label: string;
}> = [
    { value: "none", label: "None" },
    { value: "classification", label: "Classification" },
    { value: "itr_registration", label: "ITR Registration" },
    { value: "epan_registration", label: "ePAN Registration" },
    { value: "journal_entry", label: "Journal Entry" },
    { value: "ledger", label: "Ledger" },
    { value: "trial_balance", label: "Trial Balance" },
    { value: "financial_statement", label: "Financial Statement" },
    { value: "gstf-simulation", label: "GSTF Simulation" },
];

// ─── Main Component ──────────────────────────────────────────────────

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string>("");

    // Course form state
    const [showCourseForm, setShowCourseForm] = useState(false);
    const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
    const [courseForm, setCourseForm] = useState<CourseFormData>(emptyCourseForm);
    const [isSavingCourse, setIsSavingCourse] = useState(false);

    // Chapter state
    const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [isLoadingChapters, setIsLoadingChapters] = useState(false);
    const [showChapterForm, setShowChapterForm] = useState(false);
    const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
    const [chapterForm, setChapterForm] = useState<ChapterFormData>(emptyChapterForm);
    const [isSavingChapter, setIsSavingChapter] = useState(false);
    const [draggedChapterId, setDraggedChapterId] = useState<string | null>(null);

    // ─── Fetch Courses ───────────────────────────────────────────────

    const fetchCourses = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/courses");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch modules");
            setCourses(data.courses || []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchUserRole = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/me");
            if (!res.ok) return;

            const data = await res.json();
            if (data.role) {
                setUserRole(data.role);
            }
        } catch (err) {
            console.error("Error fetching user role:", err);
        }
    }, []);

    useEffect(() => {
        fetchUserRole();
        fetchCourses();
    }, [fetchCourses, fetchUserRole]);

    // ─── Fetch Chapters ────────────────────────────────────────────

    const fetchChapters = useCallback(async (moduleId: string) => {
        setIsLoadingChapters(true);
        try {
            const res = await fetch(`/api/admin/chapters?courseId=${moduleId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setChapters(data.chapters || []);
        } catch (err: unknown) {
            console.error("Failed to fetch chapters:", err);
            setChapters([]);
        } finally {
            setIsLoadingChapters(false);
        }
    }, []);

    // ─── Course CRUD ─────────────────────────────────────────────────

    const openCreateCourse = () => {
        setEditingCourseId(null);
        setCourseForm(emptyCourseForm);
        setShowCourseForm(true);
    };

    const openEditCourse = (course: Course) => {
        setEditingCourseId(course.id);
        setCourseForm({
            title: course.title,
            slug: course.slug,
            icon_name: course.icon_name,
            bg_color: course.bg_color,
            text_color: course.text_color,
            course_count: course.course_count,
            is_active: typeof course.is_active === "boolean" ? course.is_active : true,
            is_hidden: typeof course.is_hidden === "boolean" ? course.is_hidden : false,
        });
        setShowCourseForm(true);
    };

    const cancelCourseForm = () => {
        setShowCourseForm(false);
        setEditingCourseId(null);
        setCourseForm(emptyCourseForm);
    };

    const handleCourseTitleChange = (value: string) => {
        setCourseForm((prev) => ({
            ...prev,
            title: value,
            slug: editingCourseId ? prev.slug : slugify(value),
        }));
    };

    const saveCourse = async () => {
        if (!courseForm.title.trim() || !courseForm.slug.trim()) return;
        setIsSavingCourse(true);
        try {
            const url = editingCourseId
                ? `/api/admin/courses/${editingCourseId}`
                : "/api/admin/courses";
            const method = editingCourseId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(courseForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            cancelCourseForm();
            fetchCourses();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Save failed");
        } finally {
            setIsSavingCourse(false);
        }
    };

    const deleteCourse = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            if (expandedCourseId === id) {
                setExpandedCourseId(null);
                setChapters([]);
            }
            fetchCourses();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Delete failed");
        }
    };

    // ─── Chapter CRUD ──────────────────────────────────────────────

    const toggleExpand = (moduleId: string) => {
        if (expandedCourseId === moduleId) {
            setExpandedCourseId(null);
            setChapters([]);
            setShowChapterForm(false);
        } else {
            setExpandedCourseId(moduleId);
            fetchChapters(moduleId);
            setShowChapterForm(false);
        }
    };

    const openCreateChapter = () => {
        setEditingChapterId(null);
        setChapterForm({
            ...emptyChapterForm,
            sort_order: chapters.length,
        });
        setShowChapterForm(true);
    };

    const openEditChapter = (ch: Chapter) => {
        setEditingChapterId(ch.id);
        setChapterForm({
            title: ch.title,
            slug: ch.slug,
            simulator_type: ch.simulator_type ?? "none",
            task_count: ch.task_count,
            sort_order: ch.sort_order,
            is_active: typeof ch.is_active === "boolean" ? ch.is_active : true,
        });
        setShowChapterForm(true);
    };

    const cancelSubcourseForm = () => {
        setShowChapterForm(false);
        setEditingChapterId(null);
        setChapterForm(emptyChapterForm);
    };

    const handleChapterTitleChange = (value: string) => {
        setChapterForm((prev) => ({
            ...prev,
            title: value,
            slug: editingChapterId ? prev.slug : slugify(value),
        }));
    };

    const saveChapter = async () => {
        if (!chapterForm.title.trim() || !chapterForm.slug.trim() || !expandedCourseId) return;
        setIsSavingChapter(true);
        try {
            const url = editingChapterId
                ? `/api/admin/chapters/${editingChapterId}`
                : "/api/admin/chapters";
            const method = editingChapterId ? "PUT" : "POST";

            const body = editingChapterId
                ? chapterForm
                : { ...chapterForm, course_id: expandedCourseId };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            cancelSubcourseForm();
            fetchChapters(expandedCourseId);
            fetchCourses(); // refresh chapter counts
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Save failed");
        } finally {
            setIsSavingChapter(false);
        }
    };

    const deleteChapter = async (id: string) => {
        if (!expandedCourseId) return;
        try {
            const res = await fetch(`/api/admin/chapters/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            fetchChapters(expandedCourseId);
            fetchCourses();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Delete failed");
        }
    };

    const persistChapterOrder = async (orderedChapters: Chapter[]) => {
        try {
            await Promise.all(
                orderedChapters.map((chapter, index) =>
                    fetch(`/api/admin/chapters/${chapter.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ sort_order: index }),
                    }),
                ),
            );
            if (expandedCourseId) {
                fetchChapters(expandedCourseId);
            }
            fetchCourses();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to reorder chapters");
        }
    };

    const moveChapter = (fromId: string, toId: string) => {
        if (fromId === toId) return;

        setChapters((current) => {
            const fromIndex = current.findIndex((chapter) => chapter.id === fromId);
            const toIndex = current.findIndex((chapter) => chapter.id === toId);
            if (fromIndex < 0 || toIndex < 0) return current;

            const next = [...current];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            const normalized = next.map((chapter, index) => ({ ...chapter, sort_order: index }));
            void persistChapterOrder(normalized);
            return normalized;
        });
    };

    // ─── Color helpers ───────────────────────────────────────────────

    const getColorLabel = (bg: string) => {
        return COLOR_OPTIONS.find((c) => c.bg === bg)?.label || bg;
    };

    const canManageCourses = userRole === "super_admin" || userRole === "admin";
    const canCreateCourses = userRole === "super_admin";
    const canCreateChapters = userRole === "super_admin" || userRole === "admin" || userRole === "faculty";
    const canEditChapters = userRole === "super_admin" || userRole === "admin" || userRole === "faculty";
    const canDeleteChapters = userRole === "super_admin" || userRole === "admin";

    // ─── Render ──────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background border-b border-border shadow-sm">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-muted-foreground hover:text-blue-600 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-sm font-medium">Dashboard</span>
                        </Link>
                        <Separator orientation="vertical" className="h-6" />
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                                <Layout className="h-4 w-4 text-white" />
                            </div>
                            <h1 className="text-lg font-bold text-foreground">Course Contents</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link href="/dashboard/admin/content/questions">
                            <Button variant="outline">Manage Tasks</Button>
                        </Link>
                        {canCreateCourses && (
                            <Button onClick={openCreateCourse} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Course
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Error Bar */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between text-sm">
                        <span>{error}</span>
                        <button onClick={() => setError(null)}>
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Course Form (Create / Edit) */}
                {showCourseForm && canManageCourses && (
                    <div className="mb-8 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-muted border-b border-border flex items-center justify-between">
                            <h2 className="font-semibold text-foreground">
                                {editingCourseId ? "Edit Course" : "New Course"}
                            </h2>
                            <button onClick={cancelCourseForm}>
                                <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Title + Slug */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">Title *</label>
                                    <Input
                                        value={courseForm.title}
                                        onChange={(e) => handleCourseTitleChange(e.target.value)}
                                        placeholder="e.g. Income Tax"
                                        className="rounded-lg"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">Slug *</label>
                                    <Input
                                        value={courseForm.slug}
                                        onChange={(e) =>
                                            setCourseForm((prev) => ({ ...prev, slug: e.target.value }))
                                        }
                                        placeholder="e.g. income-tax"
                                        className="rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Icon + Color + Chapter Count */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">Icon</label>
                                    <select
                                        value={courseForm.icon_name}
                                        onChange={(e) =>
                                            setCourseForm((prev) => ({ ...prev, icon_name: e.target.value }))
                                        }
                                        className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    >
                                        {ICON_OPTIONS.map((icon) => (
                                            <option key={icon} value={icon}>
                                                {icon}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">Color Theme</label>
                                    <select
                                        value={courseForm.bg_color}
                                        onChange={(e) => {
                                            const color = COLOR_OPTIONS.find((c) => c.bg === e.target.value);
                                            if (color) {
                                                setCourseForm((prev) => ({
                                                    ...prev,
                                                    bg_color: color.bg,
                                                    text_color: color.text,
                                                }));
                                            }
                                        }}
                                        className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    >
                                        {COLOR_OPTIONS.map((c) => (
                                            <option key={c.bg} value={c.bg}>
                                                {c.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-foreground">Chapter Count</label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={courseForm.course_count}
                                        onChange={(e) =>
                                            setCourseForm((prev) => ({
                                                ...prev,
                                                course_count: parseInt(e.target.value) || 0,
                                            }))
                                        }
                                        className="rounded-lg"
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground">
                                <input
                                    type="checkbox"
                                    checked={courseForm.is_active}
                                    onChange={(e) =>
                                        setCourseForm((prev) => ({
                                            ...prev,
                                            is_active: e.target.checked,
                                        }))
                                    }
                                />
                                Course is enabled (visible to learners)
                            </label>

                            <label className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground">
                                <input
                                    type="checkbox"
                                    checked={courseForm.is_hidden}
                                    onChange={(e) =>
                                        setCourseForm((prev) => ({
                                            ...prev,
                                            is_hidden: e.target.checked,
                                        }))
                                    }
                                />
                                Hide from admin and faculty dashboard lists
                            </label>

                            {/* Preview */}
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted border border-border">
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${safeBgText(courseForm.bg_color, courseForm.text_color).bg} ${safeBgText(courseForm.bg_color, courseForm.text_color).text}`}
                                >
                                    {(() => {
                                        const PreviewIcon = IconMap[courseForm.icon_name] || BookOpen;
                                        return <PreviewIcon className="h-5 w-5" />;
                                    })()}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        {courseForm.title || "Course Title"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        /{courseForm.slug || "slug"} · {courseForm.course_count} chapters · Icon: {courseForm.icon_name} · {courseForm.is_active ? "Enabled" : "Disabled"} · {courseForm.is_hidden ? "Hidden" : "Visible"}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" onClick={cancelCourseForm}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={saveCourse}
                                    disabled={isSavingCourse || !courseForm.title.trim()}
                                    className="gap-2"
                                >
                                    {isSavingCourse ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {editingCourseId ? "Update" : "Create"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
                        <p className="text-sm text-muted-foreground font-medium">Loading courses...</p>
                    </div>
                ) : courses.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-dashed border-border">
                        <div className="h-16 w-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                            <BookOpen className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">No courses yet</h3>
                        <p className="text-sm text-muted-foreground mt-1 mb-6">
                            Create your first learning course to get started.
                        </p>
                        {canCreateCourses && (
                            <Button onClick={openCreateCourse} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Course
                            </Button>
                        )}
                    </div>
                ) : (
                    /* Courses List */
                    <div className="space-y-3">
                        {courses.map((course) => {
                            const isExpanded = expandedCourseId === course.id;
                            const chapterCount =
                                course.chapters && course.chapters[0]
                                    ? course.chapters[0].count
                                    : 0;

                            return (
                                <div
                                    key={course.id}
                                    className="bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                                >
                                    {/* Course Row */}
                                    <div className="flex items-center gap-4 px-5 py-4">
                                        {/* Expand Toggle */}
                                        <button
                                            onClick={() => toggleExpand(course.id)}
                                            className="p-1 hover:bg-accent rounded-lg transition-colors"
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </button>

                                        {/* Icon */}
                                        <div
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${safeBgText(course.bg_color, course.text_color).bg} ${safeBgText(course.bg_color, course.text_color).text}`}
                                        >
                                            {(() => {
                                                const ListIcon = IconMap[course.icon_name] || BookOpen;
                                                return <ListIcon className="h-5 w-5" />;
                                            })()}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-foreground truncate">
                                                    {course.title}
                                                </h3>
                                                <Badge variant="secondary" className="text-[10px]">
                                                    {course.slug}
                                                </Badge>
                                                <Badge
                                                    variant={course.is_active ? "default" : "outline"}
                                                    className="text-[10px]"
                                                >
                                                    {course.is_active ? "Enabled" : "Disabled"}
                                                </Badge>
                                                <Badge
                                                    variant={course.is_hidden ? "destructive" : "secondary"}
                                                    className="text-[10px]"
                                                >
                                                    {course.is_hidden ? "Hidden" : "Visible"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                                                <span>{course.progress} courses</span>
                                                <span>·</span>
                                                <span>{chapterCount} chapters</span>
                                                <span>·</span>
                                                <span>Icon: {course.icon_name}</span>
                                            </div>
                                        </div>

                                        {/* Color Preview */}
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] hidden sm:inline-flex"
                                        >
                                            {getColorLabel(course.bg_color)}
                                        </Badge>

                                        {/* Actions */}
                                        {canManageCourses && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => openEditCourse(course)}
                                                    className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                                                    title="Edit course"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>

                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <button
                                                            className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                                            title="Delete course"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete &quot;{course.title}&quot;?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete this course and all its chapters. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                variant="destructive"
                                                                onClick={() => deleteCourse(course.id)}
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        )}
                                    </div>

                                    {/* Expanded: Chapters */}
                                    {isExpanded && (
                                        <div className="border-t border-border bg-muted/30">
                                            <div className="px-5 py-3 flex items-center justify-between">
                                                <h4 className="text-sm font-semibold text-foreground">
                                                    Chapters
                                                </h4>
                                                {canCreateChapters && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={openCreateChapter}
                                                        className="gap-1.5 h-8 text-xs"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                        Add Chapter
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Chapter Form */}
                                            {showChapterForm && (canCreateChapters || (canEditChapters && editingChapterId)) && (
                                                <div className="mx-5 mb-3 p-4 bg-card rounded-lg border border-border space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h5 className="text-sm font-semibold text-foreground">
                                                            {editingChapterId ? "Edit Chapter" : "New Chapter"}
                                                        </h5>
                                                        <button onClick={cancelSubcourseForm}>
                                                            <X className="h-4 w-4 text-muted-foreground" />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-foreground">
                                                                Title *
                                                            </label>
                                                            <Input
                                                                value={chapterForm.title}
                                                                onChange={(e) =>
                                                                    handleChapterTitleChange(e.target.value)
                                                                }
                                                                placeholder="e.g. E-PAN"
                                                                className="rounded-lg h-8 text-sm"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-foreground">
                                                                Slug *
                                                            </label>
                                                            <Input
                                                                value={chapterForm.slug}
                                                                onChange={(e) =>
                                                                    setChapterForm((prev) => ({
                                                                        ...prev,
                                                                        slug: e.target.value,
                                                                    }))
                                                                }
                                                                placeholder="e.g. e-pan"
                                                                className="rounded-lg h-8 text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-foreground">
                                                                Task Count
                                                            </label>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                value={chapterForm.task_count}
                                                                onChange={(e) =>
                                                                    setChapterForm((prev) => ({
                                                                        ...prev,
                                                                        task_count: parseInt(e.target.value) || 0,
                                                                    }))
                                                                }
                                                                className="rounded-lg h-8 text-sm"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-foreground">
                                                                Sort Order
                                                            </label>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                value={chapterForm.sort_order}
                                                                onChange={(e) =>
                                                                    setChapterForm((prev) => ({
                                                                        ...prev,
                                                                        sort_order: parseInt(e.target.value) || 0,
                                                                    }))
                                                                }
                                                                className="rounded-lg h-8 text-sm"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-foreground">
                                                                Simulator Type
                                                            </label>
                                                            <select
                                                                value={chapterForm.simulator_type}
                                                                onChange={(e) =>
                                                                    setChapterForm((prev) => ({
                                                                        ...prev,
                                                                        simulator_type:
                                                                            e.target.value as ChapterFormData["simulator_type"],
                                                                    }))
                                                                }
                                                                className="w-full h-8 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                            >
                                                                {SIMULATOR_TYPE_OPTIONS.map((option) => (
                                                                    <option key={option.value} value={option.value}>
                                                                        {option.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <label className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-xs text-foreground">
                                                        <input
                                                            type="checkbox"
                                                            checked={chapterForm.is_active}
                                                            onChange={(e) =>
                                                                setChapterForm((prev) => ({
                                                                    ...prev,
                                                                    is_active: e.target.checked,
                                                                }))
                                                            }
                                                        />
                                                        Chapter is enabled (visible to learners)
                                                    </label>
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={cancelSubcourseForm}
                                                            className="h-8"
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={saveChapter}
                                                            disabled={
                                                                isSavingChapter ||
                                                                !chapterForm.title.trim()
                                                            }
                                                            className="gap-1.5 h-8"
                                                        >
                                                            {isSavingChapter ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <Save className="h-3.5 w-3.5" />
                                                            )}
                                                            {editingChapterId ? "Update" : "Create"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Chapters List */}
                                            {isLoadingChapters ? (
                                                <div className="px-5 py-6 text-center">
                                                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin mx-auto mb-2" />
                                                    <p className="text-xs text-muted-foreground">Loading chapters...</p>
                                                </div>
                                            ) : chapters.length === 0 ? (
                                                <div className="px-5 py-6 text-center text-sm text-muted-foreground">
                                                    No chapters yet. Click &quot;Add Chapter&quot; to create one.
                                                </div>
                                            ) : (
                                                <div className="px-5 pb-3 space-y-1.5">
                                                    {chapters.map((ch, idx) => (
                                                        <div
                                                            key={ch.id}
                                                            draggable={canCreateChapters}
                                                            onDragStart={() => setDraggedChapterId(ch.id)}
                                                            onDragEnd={() => setDraggedChapterId(null)}
                                                            onDragOver={(event) => {
                                                                if (!canCreateChapters) return;
                                                                event.preventDefault();
                                                            }}
                                                            onDrop={(event) => {
                                                                if (!canCreateChapters) return;
                                                                event.preventDefault();
                                                                if (draggedChapterId) {
                                                                    moveChapter(draggedChapterId, ch.id);
                                                                }
                                                                setDraggedChapterId(null);
                                                            }}
                                                            className={`flex items-center gap-3 px-4 py-3 bg-card rounded-lg border transition-colors ${canCreateChapters ? "cursor-move hover:border-blue-300" : "hover:border-border"} ${draggedChapterId === ch.id ? "opacity-60 ring-2 ring-blue-300" : ""}`}
                                                        >
                                                            <div
                                                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold ${canCreateChapters ? "bg-blue-600" : "bg-muted-foreground"}`}
                                                                title={canCreateChapters ? "Drag to reorder" : undefined}
                                                            >
                                                                {canCreateChapters ? <GripVertical className="h-3.5 w-3.5" /> : idx + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-foreground truncate">
                                                                    {ch.title}
                                                                </p>
                                                                <p className="text-[11px] text-muted-foreground">
                                                                    /{ch.slug} · {ch.task_count} tasks · Progress: {ch.progress}%
                                                                </p>
                                                            </div>
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[10px] hidden sm:inline-flex"
                                                            >
                                                                {SIMULATOR_TYPE_OPTIONS.find(
                                                                    (option) =>
                                                                        option.value === (ch.simulator_type ?? "none")
                                                                )?.label ?? "None"}
                                                            </Badge>
                                                            <Badge
                                                                variant={ch.is_active ? "default" : "outline"}
                                                                className="text-[10px]"
                                                            >
                                                                {ch.is_active ? "Enabled" : "Disabled"}
                                                            </Badge>
                                                            <div className="flex items-center gap-1">
                                                                {canCreateChapters && (
                                                                    <span className="hidden sm:inline-flex text-[10px] text-muted-foreground mr-1">
                                                                        {idx + 1}
                                                                    </span>
                                                                )}
                                                                {canEditChapters && (
                                                                    <button
                                                                        onClick={() => openEditChapter(ch)}
                                                                        className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md transition-colors"
                                                                        title="Edit chapter"
                                                                    >
                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                    </button>
                                                                )}
                                                                {canDeleteChapters && (
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <button
                                                                                className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                                                                                title="Delete chapter"
                                                                            >
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                            </button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>
                                                                                    Delete &quot;{ch.title}&quot;?
                                                                                </AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    This chapter will be permanently deleted.
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                <AlertDialogAction
                                                                                    variant="destructive"
                                                                                    onClick={() => deleteChapter(ch.id)}
                                                                                >
                                                                                    Delete
                                                                                </AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
