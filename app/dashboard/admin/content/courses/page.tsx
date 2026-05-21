"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Plus,
    Pencil,
    Trash2,
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

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

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

    // ─── Color helpers ───────────────────────────────────────────────

    const getColorLabel = (bg: string) => {
        return COLOR_OPTIONS.find((c) => c.bg === bg)?.label || bg;
    };

    // ─── Render ──────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-sm font-medium">Dashboard</span>
                        </Link>
                        <Separator orientation="vertical" className="h-6" />
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                                <Layout className="h-4 w-4 text-white" />
                            </div>
                            <h1 className="text-lg font-bold text-slate-900">Content Courses</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/admin/content/questions">
                            <Button variant="outline">Manage Tasks</Button>
                        </Link>
                        <Button onClick={openCreateCourse} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Course
                        </Button>
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
                {showCourseForm && (
                    <div className="mb-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-semibold text-slate-900">
                                {editingCourseId ? "Edit Course" : "New Course"}
                            </h2>
                            <button onClick={cancelCourseForm}>
                                <X className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Title + Slug */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Title *</label>
                                    <Input
                                        value={courseForm.title}
                                        onChange={(e) => handleCourseTitleChange(e.target.value)}
                                        placeholder="e.g. Income Tax"
                                        className="rounded-lg"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Slug *</label>
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

                            {/* Icon + Color + Course Count */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Icon</label>
                                    <select
                                        value={courseForm.icon_name}
                                        onChange={(e) =>
                                            setCourseForm((prev) => ({ ...prev, icon_name: e.target.value }))
                                        }
                                        className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    >
                                        {ICON_OPTIONS.map((icon) => (
                                            <option key={icon} value={icon}>
                                                {icon}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Color Theme</label>
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
                                        className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    >
                                        {COLOR_OPTIONS.map((c) => (
                                            <option key={c.bg} value={c.bg}>
                                                {c.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Course Count</label>
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

                            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
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

                            {/* Preview */}
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${courseForm.bg_color} ${courseForm.text_color}`}
                                >
                                    {(() => {
                                        const PreviewIcon = IconMap[courseForm.icon_name] || BookOpen;
                                        return <PreviewIcon className="h-5 w-5" />;
                                    })()}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {courseForm.title || "Course Title"}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        /{courseForm.slug || "slug"} · {courseForm.course_count} courses · Icon: {courseForm.icon_name} · {courseForm.is_active ? "Enabled" : "Disabled"}
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
                        <p className="text-sm text-slate-500 font-medium">Loading courses...</p>
                    </div>
                ) : courses.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                        <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                            <BookOpen className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">No courses yet</h3>
                        <p className="text-sm text-slate-500 mt-1 mb-6">
                            Create your first learning course to get started.
                        </p>
                        <Button onClick={openCreateCourse} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Course
                        </Button>
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
                                    className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                                >
                                    {/* Course Row */}
                                    <div className="flex items-center gap-4 px-5 py-4">
                                        {/* Expand Toggle */}
                                        <button
                                            onClick={() => toggleExpand(course.id)}
                                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="h-5 w-5 text-slate-400" />
                                            ) : (
                                                <ChevronRight className="h-5 w-5 text-slate-400" />
                                            )}
                                        </button>

                                        {/* Icon */}
                                        <div
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${course.bg_color} ${course.text_color}`}
                                        >
                                            {(() => {
                                                const ListIcon = IconMap[course.icon_name] || BookOpen;
                                                return <ListIcon className="h-5 w-5" />;
                                            })()}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-slate-900 truncate">
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
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
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
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openEditCourse(course)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit module"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <button
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete module"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete &quot;{course.title}&quot;?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete this module and all its
                                                            chapters. This action cannot be undone.
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
                                    </div>

                                    {/* Expanded: Chapters */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-100 bg-slate-50/50">
                                            <div className="px-5 py-3 flex items-center justify-between">
                                                <h4 className="text-sm font-semibold text-slate-700">
                                                    Chapters
                                                </h4>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={openCreateChapter}
                                                    className="gap-1.5 h-8 text-xs"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Add Chapter
                                                </Button>
                                            </div>

                                            {/* Chapter Form */}
                                            {showChapterForm && (
                                                <div className="mx-5 mb-3 p-4 bg-white rounded-lg border border-slate-200 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h5 className="text-sm font-semibold text-slate-800">
                                                            {editingChapterId ? "Edit Chapter" : "New Chapter"}
                                                        </h5>
                                                        <button onClick={cancelSubcourseForm}>
                                                            <X className="h-4 w-4 text-slate-400" />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-slate-600">
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
                                                            <label className="text-xs font-medium text-slate-600">
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
                                                            <label className="text-xs font-medium text-slate-600">
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
                                                            <label className="text-xs font-medium text-slate-600">
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
                                                            <label className="text-xs font-medium text-slate-600">
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
                                                                className="w-full h-8 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                                            >
                                                                {SIMULATOR_TYPE_OPTIONS.map((option) => (
                                                                    <option key={option.value} value={option.value}>
                                                                        {option.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
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
                                                    <p className="text-xs text-slate-500">Loading chapters...</p>
                                                </div>
                                            ) : chapters.length === 0 ? (
                                                <div className="px-5 py-6 text-center text-sm text-slate-500">
                                                    No chapters yet. Click &quot;Add Chapter&quot; to create one.
                                                </div>
                                            ) : (
                                                <div className="px-5 pb-3 space-y-1.5">
                                                    {chapters.map((ch, idx) => (
                                                        <div
                                                            key={ch.id}
                                                            className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
                                                        >
                                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                                                                {idx + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-slate-900 truncate">
                                                                    {ch.title}
                                                                </p>
                                                                <p className="text-[11px] text-slate-500">
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
                                                                <button
                                                                    onClick={() => openEditChapter(ch)}
                                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                                    title="Edit chapter"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </button>
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <button
                                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
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
