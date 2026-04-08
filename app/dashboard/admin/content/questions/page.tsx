"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
    AlertCircle,
    ArrowLeft,
    ImageIcon,
    LayoutList,
    Loader2,
    Plus,
    Save,
    Trash2,
    X,
} from "lucide-react";

import { QAEditor } from "@/components/admin/qa-editor";
import type {
    SimulatorType,
    SyncAnswersPayload,
} from "@/components/admin/qa-editor/types";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

interface Module {
    id: string;
    title: string;
    slug: string;
}

interface Submodule {
    id: string;
    module_id: string;
    title: string;
    slug: string;
    simulator_type: SimulatorType | null;
}

interface Question {
    id: string;
    submodule_id: string;
    title: string;
    paragraph: string;
    has_table: boolean;
    table_data: {
        headers?: string[];
        rows?: string[][];
    } | null;
    has_image: boolean;
    image_url: string | null;
}

interface QuestionFormState {
    title: string;
    paragraph: string;
    hasImage: boolean;
    imageUrl: string;
}

function getEmptyQuestionForm(): QuestionFormState {
    return {
        title: "",
        paragraph: "",
        hasImage: false,
        imageUrl: "",
    };
}

export default function AdminQuestionsPage() {
    const [modules, setModules] = useState<Module[]>([]);
    const [submodules, setSubmodules] = useState<Submodule[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedModuleId, setSelectedModuleId] = useState("");
    const [selectedSubmoduleId, setSelectedSubmoduleId] = useState("");
    const [simulatorType, setSimulatorType] = useState<SimulatorType | null>(null);
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
    const [form, setForm] = useState<QuestionFormState>(getEmptyQuestionForm);
    const [qaPayload, setQaPayload] = useState<SyncAnswersPayload | null>(null);
    const [isLoadingModules, setIsLoadingModules] = useState(true);
    const [isLoadingSubmodules, setIsLoadingSubmodules] = useState(false);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
    const [isLoadingAnswers, setIsLoadingAnswers] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const fetchModules = useCallback(async () => {
        setIsLoadingModules(true);
        setError(null);

        try {
            const res = await fetch("/api/admin/modules");
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch modules");
            }

            setModules(data.modules || []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to fetch modules");
        } finally {
            setIsLoadingModules(false);
        }
    }, []);

    const fetchSubmodules = useCallback(async (moduleId: string) => {
        setIsLoadingSubmodules(true);

        try {
            const res = await fetch(`/api/admin/submodules?moduleId=${moduleId}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch submodules");
            }

            setSubmodules(data.submodules || []);
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : "Failed to fetch submodules",
            );
            setSubmodules([]);
        } finally {
            setIsLoadingSubmodules(false);
        }
    }, []);

    const fetchQuestions = useCallback(async (submoduleId: string) => {
        setIsLoadingQuestions(true);

        try {
            const res = await fetch(`/api/admin/questions?submoduleId=${submoduleId}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch questions");
            }

            setQuestions(data.questions || []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to fetch questions");
            setQuestions([]);
        } finally {
            setIsLoadingQuestions(false);
        }
    }, []);

    useEffect(() => {
        void fetchModules();
    }, [fetchModules]);

    useEffect(() => {
        if (!selectedModuleId) {
            setSubmodules([]);
            setSelectedSubmoduleId("");
            setSimulatorType(null);
            setQuestions([]);
            return;
        }

        void fetchSubmodules(selectedModuleId);
    }, [fetchSubmodules, selectedModuleId]);

    useEffect(() => {
        if (!selectedSubmoduleId) {
            setQuestions([]);
            return;
        }

        void fetchQuestions(selectedSubmoduleId);
    }, [fetchQuestions, selectedSubmoduleId]);

    const resetForm = useCallback(() => {
        setEditingQuestionId(null);
        setForm(getEmptyQuestionForm());
        setQaPayload(null);
        setIsLoadingAnswers(false);
    }, []);

    const openQuestion = useCallback(
        async (question: Question, options?: { preserveStatus?: boolean }) => {
            setEditingQuestionId(question.id);
            setForm({
                title: question.title,
                paragraph: question.paragraph || "",
                hasImage: question.has_image,
                imageUrl: question.image_url || "",
            });
            setQaPayload(null);
            if (!options?.preserveStatus) {
                setSuccessMessage(null);
                setError(null);
            }
            setIsLoadingAnswers(true);

            try {
                const res = await fetch(`/api/admin/questions/${question.id}/answers`);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Failed to load question answers");
                }

                setQaPayload(data.answers ?? null);
                setSimulatorType(data.simulatorType ?? simulatorType ?? "none");
            } catch (err: unknown) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load question answers",
                );
            } finally {
                setIsLoadingAnswers(false);
            }
        },
        [simulatorType],
    );

    const saveQuestion = async () => {
        if (!selectedSubmoduleId || !form.title.trim()) {
            setError("Select a submodule and provide a question title.");
            return;
        }

        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);

        let savedQuestion: Question | null = null;

        try {
            const questionPayload = {
                title: form.title.trim(),
                paragraph: form.paragraph.trim(),
                has_image: form.hasImage,
                image_url: form.hasImage ? form.imageUrl.trim() : null,
            };

            const questionRes = await fetch(
                editingQuestionId
                    ? `/api/admin/questions/${editingQuestionId}`
                    : "/api/admin/questions",
                {
                    method: editingQuestionId ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(
                        editingQuestionId
                            ? questionPayload
                            : {
                                  ...questionPayload,
                                  submodule_id: selectedSubmoduleId,
                              },
                    ),
                },
            );
            const questionData = await questionRes.json();

            if (!questionRes.ok) {
                throw new Error(questionData.error || "Failed to save question");
            }

            savedQuestion = questionData.question ?? null;
            if (!savedQuestion?.id) {
                throw new Error("Question was not returned by the API");
            }

            if (qaPayload !== null) {
                const answersRes = await fetch(
                    `/api/admin/questions/${savedQuestion.id}/sync-answers`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(qaPayload),
                    },
                );
                const answersData = await answersRes.json();

                if (!answersRes.ok) {
                    throw new Error(
                        answersData.error || "Failed to sync question answers",
                    );
                }
            }

            setSuccessMessage("Question and answers saved.");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Save failed");
        } finally {
            if (selectedSubmoduleId) {
                await fetchQuestions(selectedSubmoduleId);
            }

            if (savedQuestion) {
                await openQuestion(savedQuestion, { preserveStatus: true });
            }

            setIsSaving(false);
        }
    };

    const deleteQuestion = async (questionId: string) => {
        try {
            const res = await fetch(`/api/admin/questions/${questionId}`, {
                method: "DELETE",
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to delete question");
            }

            if (selectedSubmoduleId) {
                await fetchQuestions(selectedSubmoduleId);
            }

            if (editingQuestionId === questionId) {
                resetForm();
            }

            setSuccessMessage("Question deleted.");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Delete failed");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Dashboard
                        </Link>
                        <Separator orientation="vertical" className="h-6" />
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                                <LayoutList className="h-4 w-4" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900">
                                    Case Study Questions
                                </h1>
                                <p className="text-xs text-slate-500">
                                    Configure prompts, unified Q&amp;A, and supporting images
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/admin/content/modules">
                            <Button variant="outline">Manage Modules</Button>
                        </Link>
                        <Button
                            onClick={() => {
                                resetForm();
                                setSuccessMessage(null);
                                setError(null);
                            }}
                            disabled={!selectedSubmoduleId}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            New Question
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[340px_minmax(0,1fr)]">
                <aside className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-slate-900">
                            Select Context
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Choose the submodule that owns these case-study questions.
                        </p>

                        <div className="mt-4 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">
                                    Module
                                </label>
                                <select
                                    value={selectedModuleId}
                                    onChange={(event) => {
                                        setSelectedModuleId(event.target.value);
                                        setSelectedSubmoduleId("");
                                        setSimulatorType(null);
                                        setQuestions([]);
                                        resetForm();
                                    }}
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Select a module</option>
                                    {modules.map((module) => (
                                        <option key={module.id} value={module.id}>
                                            {module.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">
                                    Submodule
                                </label>
                                <select
                                    value={selectedSubmoduleId}
                                    onChange={(event) => {
                                        const nextSubmoduleId = event.target.value;
                                        const selectedSubmodule =
                                            submodules.find(
                                                (submodule) =>
                                                    submodule.id === nextSubmoduleId,
                                            ) ?? null;
                                        setSelectedSubmoduleId(nextSubmoduleId);
                                        setSimulatorType(
                                            selectedSubmodule?.simulator_type ?? null,
                                        );
                                        resetForm();
                                    }}
                                    disabled={!selectedModuleId || isLoadingSubmodules}
                                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                                >
                                    <option value="">
                                        {isLoadingSubmodules
                                            ? "Loading submodules..."
                                            : "Select a submodule"}
                                    </option>
                                    {submodules.map((submodule) => (
                                        <option key={submodule.id} value={submodule.id}>
                                            {submodule.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-5 py-4">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-900">
                                        Questions
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Existing prompts for the selected submodule.
                                    </p>
                                </div>
                                <Badge variant="secondary">{questions.length}</Badge>
                            </div>
                        </div>

                        <div className="max-h-[65vh] overflow-y-auto p-3">
                            {isLoadingModules || isLoadingQuestions ? (
                                <div className="flex items-center justify-center gap-3 rounded-xl p-8 text-sm text-slate-500">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading...
                                </div>
                            ) : !selectedSubmoduleId ? (
                                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                                    Pick a submodule to load questions.
                                </div>
                            ) : questions.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                                    No questions yet for this submodule.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {questions.map((question, index) => (
                                        <button
                                            key={question.id}
                                            type="button"
                                            onClick={() => void openQuestion(question)}
                                            className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                                                editingQuestionId === question.id
                                                    ? "border-emerald-300 bg-emerald-50"
                                                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                        Question {index + 1}
                                                    </p>
                                                    <p className="mt-1 font-medium text-slate-900">
                                                        {question.title}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {question.has_image && (
                                                        <ImageIcon className="h-4 w-4 text-slate-400" />
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                <section className="space-y-6">
                    {error && (
                        <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="mt-0.5 h-4 w-4" />
                                <span>{error}</span>
                            </div>
                            <button type="button" onClick={() => setError(null)}>
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    {successMessage && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {successMessage}
                        </div>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        {editingQuestionId ? "Edit Question" : "New Question"}
                                    </h2>
                                    <Badge variant="outline">
                                        {simulatorType ?? "none"}
                                    </Badge>
                                </div>
                                <p className="text-sm text-slate-500">
                                    Author the prompt and expected answers in one place.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {editingQuestionId && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="gap-2 text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                    Delete this question?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This removes the question.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() =>
                                                        editingQuestionId &&
                                                        deleteQuestion(editingQuestionId)
                                                    }
                                                    className="bg-red-600 hover:bg-red-700"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}

                                <Button variant="outline" onClick={resetForm}>
                                    Clear
                                </Button>
                                <Button
                                    onClick={saveQuestion}
                                    disabled={!selectedSubmoduleId || isSaving}
                                    className="gap-2"
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    Save Q&amp;A
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-8 px-6 py-6">
                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">
                                            Question Title
                                        </label>
                                        <Input
                                            value={form.title}
                                            onChange={(event) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    title: event.target.value,
                                                }))
                                            }
                                            placeholder="e.g. ITR Registration for Resident Individual"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">
                                            Question Type
                                        </label>
                                        <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
                                            Case Study Prompt
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">
                                        Paragraph / Context
                                    </label>
                                    <Textarea
                                        value={form.paragraph}
                                        onChange={(event) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                paragraph: event.target.value,
                                            }))
                                        }
                                        placeholder="Describe the scenario the learner needs to solve."
                                        rows={6}
                                    />
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        Unified Q&amp;A
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        The answer grid adapts to the selected submodule&apos;s
                                        simulator type.
                                    </p>
                                </div>

                                {isLoadingAnswers ? (
                                    <div className="flex min-h-40 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading answers...
                                    </div>
                                ) : (
                                    <QAEditor
                                        simulatorType={simulatorType ?? "none"}
                                        initialPayload={qaPayload}
                                        onChange={setQaPayload}
                                        disabled={isSaving}
                                    />
                                )}
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                            <ImageIcon className="h-4 w-4 text-slate-500" />
                                            Supporting Image
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            Attach an image URL when a screenshot or document visual is required.
                                        </p>
                                    </div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={form.hasImage}
                                            onChange={(event) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    hasImage: event.target.checked,
                                                }))
                                            }
                                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        Include image
                                    </label>
                                </div>

                                {form.hasImage && (
                                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-700">
                                                Image URL
                                            </label>
                                            <Input
                                                value={form.imageUrl}
                                                onChange={(event) =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        imageUrl: event.target.value,
                                                    }))
                                                }
                                                placeholder="https://..."
                                            />
                                        </div>
                                        {form.imageUrl.trim() && (
                                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    Preview
                                                </p>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={form.imageUrl}
                                                    alt="Question asset preview"
                                                    className="max-h-72 rounded-lg border border-slate-200 object-contain"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
