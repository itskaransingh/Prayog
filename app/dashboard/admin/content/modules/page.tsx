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

interface Module {
    id: string;
    title: string;
    slug: string;
    course_count: number;
    icon_name: string;
    bg_color: string;
    text_color: string;
    progress: number;
    submodules?: { count: number }[];
}

interface Submodule {
    id: string;
    module_id: string;
    title: string;
    slug: string;
    task_count: number;
    progress: number;
    sort_order: number;
}

interface ModuleFormData {
    title: string;
    slug: string;
    icon_name: string;
    bg_color: string;
    text_color: string;
    course_count: number;
}

interface SubmoduleFormData {
    title: string;
    slug: string;
    task_count: number;
    sort_order: number;
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

const emptyModuleForm: ModuleFormData = {
    title: "",
    slug: "",
    icon_name: "BookOpen",
    bg_color: "bg-blue-50",
    text_color: "text-blue-600",
    course_count: 0,
};

const emptySubmoduleForm: SubmoduleFormData = {
    title: "",
    slug: "",
    task_count: 0,
    sort_order: 0,
};

// ─── Main Component ──────────────────────────────────────────────────

export default function AdminModulesPage() {
    const [modules, setModules] = useState<Module[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Module form state
    const [showModuleForm, setShowModuleForm] = useState(false);
    const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
    const [moduleForm, setModuleForm] = useState<ModuleFormData>(emptyModuleForm);
    const [isSavingModule, setIsSavingModule] = useState(false);

    // Submodule state
    const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
    const [submodules, setSubmodules] = useState<Submodule[]>([]);
    const [isLoadingSubmodules, setIsLoadingSubmodules] = useState(false);
    const [showSubmoduleForm, setShowSubmoduleForm] = useState(false);
    const [editingSubmoduleId, setEditingSubmoduleId] = useState<string | null>(null);
    const [submoduleForm, setSubmoduleForm] = useState<SubmoduleFormData>(emptySubmoduleForm);
    const [isSavingSubmodule, setIsSavingSubmodule] = useState(false);

    // ─── Fetch Modules ───────────────────────────────────────────────

    const fetchModules = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/modules");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch modules");
            setModules(data.modules || []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchModules();
    }, [fetchModules]);

    // ─── Fetch Submodules ────────────────────────────────────────────

    const fetchSubmodules = useCallback(async (moduleId: string) => {
        setIsLoadingSubmodules(true);
        try {
            const res = await fetch(`/api/admin/submodules?moduleId=${moduleId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSubmodules(data.submodules || []);
        } catch (err: unknown) {
            console.error("Failed to fetch submodules:", err);
            setSubmodules([]);
        } finally {
            setIsLoadingSubmodules(false);
        }
    }, []);

    // ─── Module CRUD ─────────────────────────────────────────────────

    const openCreateModule = () => {
        setEditingModuleId(null);
        setModuleForm(emptyModuleForm);
        setShowModuleForm(true);
    };

    const openEditModule = (mod: Module) => {
        setEditingModuleId(mod.id);
        setModuleForm({
            title: mod.title,
            slug: mod.slug,
            icon_name: mod.icon_name,
            bg_color: mod.bg_color,
            text_color: mod.text_color,
            course_count: mod.course_count,
        });
        setShowModuleForm(true);
    };

    const cancelModuleForm = () => {
        setShowModuleForm(false);
        setEditingModuleId(null);
        setModuleForm(emptyModuleForm);
    };

    const handleModuleTitleChange = (value: string) => {
        setModuleForm((prev) => ({
            ...prev,
            title: value,
            slug: editingModuleId ? prev.slug : slugify(value),
        }));
    };

    const saveModule = async () => {
        if (!moduleForm.title.trim() || !moduleForm.slug.trim()) return;
        setIsSavingModule(true);
        try {
            const url = editingModuleId
                ? `/api/admin/modules/${editingModuleId}`
                : "/api/admin/modules";
            const method = editingModuleId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(moduleForm),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            cancelModuleForm();
            fetchModules();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Save failed");
        } finally {
            setIsSavingModule(false);
        }
    };

    const deleteModule = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/modules/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            if (expandedModuleId === id) {
                setExpandedModuleId(null);
                setSubmodules([]);
            }
            fetchModules();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Delete failed");
        }
    };

    // ─── Submodule CRUD ──────────────────────────────────────────────

    const toggleExpand = (moduleId: string) => {
        if (expandedModuleId === moduleId) {
            setExpandedModuleId(null);
            setSubmodules([]);
            setShowSubmoduleForm(false);
        } else {
            setExpandedModuleId(moduleId);
            fetchSubmodules(moduleId);
            setShowSubmoduleForm(false);
        }
    };

    const openCreateSubmodule = () => {
        setEditingSubmoduleId(null);
        setSubmoduleForm({
            ...emptySubmoduleForm,
            sort_order: submodules.length,
        });
        setShowSubmoduleForm(true);
    };

    const openEditSubmodule = (sub: Submodule) => {
        setEditingSubmoduleId(sub.id);
        setSubmoduleForm({
            title: sub.title,
            slug: sub.slug,
            task_count: sub.task_count,
            sort_order: sub.sort_order,
        });
        setShowSubmoduleForm(true);
    };

    const cancelSubmoduleForm = () => {
        setShowSubmoduleForm(false);
        setEditingSubmoduleId(null);
        setSubmoduleForm(emptySubmoduleForm);
    };

    const handleSubmoduleTitleChange = (value: string) => {
        setSubmoduleForm((prev) => ({
            ...prev,
            title: value,
            slug: editingSubmoduleId ? prev.slug : slugify(value),
        }));
    };

    const saveSubmodule = async () => {
        if (!submoduleForm.title.trim() || !submoduleForm.slug.trim() || !expandedModuleId) return;
        setIsSavingSubmodule(true);
        try {
            const url = editingSubmoduleId
                ? `/api/admin/submodules/${editingSubmoduleId}`
                : "/api/admin/submodules";
            const method = editingSubmoduleId ? "PUT" : "POST";

            const body = editingSubmoduleId
                ? submoduleForm
                : { ...submoduleForm, module_id: expandedModuleId };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            cancelSubmoduleForm();
            fetchSubmodules(expandedModuleId);
            fetchModules(); // refresh submodule counts
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Save failed");
        } finally {
            setIsSavingSubmodule(false);
        }
    };

    const deleteSubmodule = async (id: string) => {
        if (!expandedModuleId) return;
        try {
            const res = await fetch(`/api/admin/submodules/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            fetchSubmodules(expandedModuleId);
            fetchModules();
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
                            <h1 className="text-lg font-bold text-slate-900">Content Modules</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/admin/content/questions">
                            <Button variant="outline">Manage Questions</Button>
                        </Link>
                        <Button onClick={openCreateModule} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Module
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

                {/* Module Form (Create / Edit) */}
                {showModuleForm && (
                    <div className="mb-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="font-semibold text-slate-900">
                                {editingModuleId ? "Edit Module" : "New Module"}
                            </h2>
                            <button onClick={cancelModuleForm}>
                                <X className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Title + Slug */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Title *</label>
                                    <Input
                                        value={moduleForm.title}
                                        onChange={(e) => handleModuleTitleChange(e.target.value)}
                                        placeholder="e.g. Income Tax"
                                        className="rounded-lg"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Slug *</label>
                                    <Input
                                        value={moduleForm.slug}
                                        onChange={(e) =>
                                            setModuleForm((prev) => ({ ...prev, slug: e.target.value }))
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
                                        value={moduleForm.icon_name}
                                        onChange={(e) =>
                                            setModuleForm((prev) => ({ ...prev, icon_name: e.target.value }))
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
                                        value={moduleForm.bg_color}
                                        onChange={(e) => {
                                            const color = COLOR_OPTIONS.find((c) => c.bg === e.target.value);
                                            if (color) {
                                                setModuleForm((prev) => ({
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
                                        value={moduleForm.course_count}
                                        onChange={(e) =>
                                            setModuleForm((prev) => ({
                                                ...prev,
                                                course_count: parseInt(e.target.value) || 0,
                                            }))
                                        }
                                        className="rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${moduleForm.bg_color} ${moduleForm.text_color}`}
                                >
                                    {(() => {
                                        const PreviewIcon = IconMap[moduleForm.icon_name] || BookOpen;
                                        return <PreviewIcon className="h-5 w-5" />;
                                    })()}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {moduleForm.title || "Module Title"}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        /{moduleForm.slug || "slug"} · {moduleForm.course_count} courses · Icon: {moduleForm.icon_name}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" onClick={cancelModuleForm}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={saveModule}
                                    disabled={isSavingModule || !moduleForm.title.trim()}
                                    className="gap-2"
                                >
                                    {isSavingModule ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    {editingModuleId ? "Update" : "Create"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-4" />
                        <p className="text-sm text-slate-500 font-medium">Loading modules...</p>
                    </div>
                ) : modules.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                        <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                            <BookOpen className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">No modules yet</h3>
                        <p className="text-sm text-slate-500 mt-1 mb-6">
                            Create your first learning module to get started.
                        </p>
                        <Button onClick={openCreateModule} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Module
                        </Button>
                    </div>
                ) : (
                    /* Modules List */
                    <div className="space-y-3">
                        {modules.map((mod) => {
                            const isExpanded = expandedModuleId === mod.id;
                            const subCount =
                                mod.submodules && mod.submodules[0]
                                    ? mod.submodules[0].count
                                    : 0;

                            return (
                                <div
                                    key={mod.id}
                                    className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md"
                                >
                                    {/* Module Row */}
                                    <div className="flex items-center gap-4 px-5 py-4">
                                        {/* Expand Toggle */}
                                        <button
                                            onClick={() => toggleExpand(mod.id)}
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
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${mod.bg_color} ${mod.text_color}`}
                                        >
                                            {(() => {
                                                const ListIcon = IconMap[mod.icon_name] || BookOpen;
                                                return <ListIcon className="h-5 w-5" />;
                                            })()}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-slate-900 truncate">
                                                    {mod.title}
                                                </h3>
                                                <Badge variant="secondary" className="text-[10px]">
                                                    {mod.slug}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                                                <span>{mod.course_count} courses</span>
                                                <span>·</span>
                                                <span>{subCount} submodules</span>
                                                <span>·</span>
                                                <span>Icon: {mod.icon_name}</span>
                                            </div>
                                        </div>

                                        {/* Color Preview */}
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] hidden sm:inline-flex"
                                        >
                                            {getColorLabel(mod.bg_color)}
                                        </Badge>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openEditModule(mod)}
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
                                                        <AlertDialogTitle>Delete &quot;{mod.title}&quot;?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete this module and all its
                                                            submodules. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            variant="destructive"
                                                            onClick={() => deleteModule(mod.id)}
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>

                                    {/* Expanded: Submodules */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-100 bg-slate-50/50">
                                            <div className="px-5 py-3 flex items-center justify-between">
                                                <h4 className="text-sm font-semibold text-slate-700">
                                                    Submodules
                                                </h4>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={openCreateSubmodule}
                                                    className="gap-1.5 h-8 text-xs"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Add Submodule
                                                </Button>
                                            </div>

                                            {/* Submodule Form */}
                                            {showSubmoduleForm && (
                                                <div className="mx-5 mb-3 p-4 bg-white rounded-lg border border-slate-200 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h5 className="text-sm font-semibold text-slate-800">
                                                            {editingSubmoduleId ? "Edit Submodule" : "New Submodule"}
                                                        </h5>
                                                        <button onClick={cancelSubmoduleForm}>
                                                            <X className="h-4 w-4 text-slate-400" />
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-slate-600">
                                                                Title *
                                                            </label>
                                                            <Input
                                                                value={submoduleForm.title}
                                                                onChange={(e) =>
                                                                    handleSubmoduleTitleChange(e.target.value)
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
                                                                value={submoduleForm.slug}
                                                                onChange={(e) =>
                                                                    setSubmoduleForm((prev) => ({
                                                                        ...prev,
                                                                        slug: e.target.value,
                                                                    }))
                                                                }
                                                                placeholder="e.g. e-pan"
                                                                className="rounded-lg h-8 text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-medium text-slate-600">
                                                                Task Count
                                                            </label>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                value={submoduleForm.task_count}
                                                                onChange={(e) =>
                                                                    setSubmoduleForm((prev) => ({
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
                                                                value={submoduleForm.sort_order}
                                                                onChange={(e) =>
                                                                    setSubmoduleForm((prev) => ({
                                                                        ...prev,
                                                                        sort_order: parseInt(e.target.value) || 0,
                                                                    }))
                                                                }
                                                                className="rounded-lg h-8 text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={cancelSubmoduleForm}
                                                            className="h-8"
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={saveSubmodule}
                                                            disabled={
                                                                isSavingSubmodule ||
                                                                !submoduleForm.title.trim()
                                                            }
                                                            className="gap-1.5 h-8"
                                                        >
                                                            {isSavingSubmodule ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <Save className="h-3.5 w-3.5" />
                                                            )}
                                                            {editingSubmoduleId ? "Update" : "Create"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Submodules List */}
                                            {isLoadingSubmodules ? (
                                                <div className="px-5 py-6 text-center">
                                                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin mx-auto mb-2" />
                                                    <p className="text-xs text-slate-500">Loading submodules...</p>
                                                </div>
                                            ) : submodules.length === 0 ? (
                                                <div className="px-5 py-6 text-center text-sm text-slate-500">
                                                    No submodules yet. Click &quot;Add Submodule&quot; to create one.
                                                </div>
                                            ) : (
                                                <div className="px-5 pb-3 space-y-1.5">
                                                    {submodules.map((sub, idx) => (
                                                        <div
                                                            key={sub.id}
                                                            className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
                                                        >
                                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                                                                {idx + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-slate-900 truncate">
                                                                    {sub.title}
                                                                </p>
                                                                <p className="text-[11px] text-slate-500">
                                                                    /{sub.slug} · {sub.task_count} tasks · Progress: {sub.progress}%
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => openEditSubmodule(sub)}
                                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                                    title="Edit submodule"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </button>
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <button
                                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                                            title="Delete submodule"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>
                                                                                Delete &quot;{sub.title}&quot;?
                                                                            </AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                This submodule will be permanently deleted.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                variant="destructive"
                                                                                onClick={() => deleteSubmodule(sub.id)}
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
