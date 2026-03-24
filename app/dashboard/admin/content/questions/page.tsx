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
    TableProperties,
    Target,
    Trash2,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
}

interface EvaluationMapping {
    fieldPath: string;
    label: string;
    expectedValue: string;
    weight?: number;
}

interface EvaluationCriteria {
    id: string;
    question_id: string;
    evaluation_data: {
        mappings?: EvaluationMapping[];
    };
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
    evaluation_criteria?: EvaluationCriteria[];
}

interface QuestionFormState {
    title: string;
    paragraph: string;
    hasTable: boolean;
    tableHeaders: string[];
    tableRows: string[][];
    hasImage: boolean;
    imageUrl: string;
    evaluationMappings: EvaluationMapping[];
}

function getEmptyQuestionForm(): QuestionFormState {
    return {
        title: "",
        paragraph: "",
        hasTable: false,
        tableHeaders: ["Field", "Value"],
        tableRows: [["", ""]],
        hasImage: false,
        imageUrl: "",
        evaluationMappings: [
            {
                fieldPath: "",
                label: "",
                expectedValue: "",
                weight: 1,
            },
        ],
    };
}

function createEmptyRow(columnCount: number) {
    return Array.from({ length: columnCount }, () => "");
}

export default function AdminQuestionsPage() {
    const [modules, setModules] = useState<Module[]>([]);
    const [submodules, setSubmodules] = useState<Submodule[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedModuleId, setSelectedModuleId] = useState("");
    const [selectedSubmoduleId, setSelectedSubmoduleId] = useState("");
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
    const [form, setForm] = useState<QuestionFormState>(getEmptyQuestionForm);
    const [isLoadingModules, setIsLoadingModules] = useState(true);
    const [isLoadingSubmodules, setIsLoadingSubmodules] = useState(false);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
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
                err instanceof Error ? err.message : "Failed to fetch submodules"
            );
            setSubmodules([]);
        } finally {
            setIsLoadingSubmodules(false);
        }
    }, []);

    const fetchQuestions = useCallback(async (submoduleId: string) => {
        setIsLoadingQuestions(true);

        try {
            const res = await fetch(
                `/api/admin/questions?submoduleId=${submoduleId}`
            );
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
        fetchModules();
    }, [fetchModules]);

    useEffect(() => {
        if (!selectedModuleId) {
            setSubmodules([]);
            setSelectedSubmoduleId("");
            setQuestions([]);
            return;
        }

        fetchSubmodules(selectedModuleId);
    }, [fetchSubmodules, selectedModuleId]);

    useEffect(() => {
        if (!selectedSubmoduleId) {
            setQuestions([]);
            return;
        }

        fetchQuestions(selectedSubmoduleId);
    }, [fetchQuestions, selectedSubmoduleId]);

    const resetForm = () => {
        setEditingQuestionId(null);
        setForm(getEmptyQuestionForm());
    };

    const openQuestion = (question: Question) => {
        setEditingQuestionId(question.id);
        setForm({
            title: question.title,
            paragraph: question.paragraph || "",
            hasTable: question.has_table,
            tableHeaders:
                question.table_data?.headers?.length
                    ? question.table_data.headers
                    : ["Field", "Value"],
            tableRows:
                question.table_data?.rows?.length
                    ? question.table_data.rows
                    : [["", ""]],
            hasImage: question.has_image,
            imageUrl: question.image_url || "",
            evaluationMappings:
                question.evaluation_criteria?.[0]?.evaluation_data?.mappings?.length
                    ? question.evaluation_criteria[0].evaluation_data.mappings!.map(
                          (mapping) => ({
                              fieldPath: mapping.fieldPath || "",
                              label: mapping.label || "",
                              expectedValue: mapping.expectedValue || "",
                              weight: mapping.weight ?? 1,
                          })
                      )
                    : getEmptyQuestionForm().evaluationMappings,
        });
        setSuccessMessage(null);
    };

    const saveQuestion = async () => {
        if (!selectedSubmoduleId || !form.title.trim()) {
            setError("Select a submodule and provide a question title.");
            return;
        }

        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const questionPayload = {
                title: form.title.trim(),
                paragraph: form.paragraph.trim(),
                has_table: form.hasTable,
                table_data: form.hasTable
                    ? {
                          headers: form.tableHeaders,
                          rows: form.tableRows,
                      }
                    : null,
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
                              }
                    ),
                }
            );
            const questionData = await questionRes.json();

            if (!questionRes.ok) {
                throw new Error(questionData.error || "Failed to save question");
            }

            const questionId = editingQuestionId || questionData.question?.id;

            const evaluationRes = await fetch("/api/admin/evaluation-criteria", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question_id: questionId,
                    evaluation_data: {
                        mappings: form.evaluationMappings.filter(
                            (mapping) =>
                                mapping.fieldPath.trim() ||
                                mapping.label.trim() ||
                                mapping.expectedValue.trim()
                        ),
                    },
                }),
            });
            const evaluationData = await evaluationRes.json();

            if (!evaluationRes.ok) {
                throw new Error(
                    evaluationData.error || "Failed to save evaluation criteria"
                );
            }

            if (questionData.question) {
                openQuestion({
                    ...questionData.question,
                    evaluation_criteria: [evaluationData.evaluationCriteria],
                });
            }
            await fetchQuestions(selectedSubmoduleId);

            setSuccessMessage(
                editingQuestionId
                    ? "Question updated successfully."
                    : "Question created successfully."
            );
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Save failed");
        } finally {
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

    const updateHeader = (index: number, value: string) => {
        setForm((prev) => {
            const nextHeaders = [...prev.tableHeaders];
            nextHeaders[index] = value;
            return { ...prev, tableHeaders: nextHeaders };
        });
    };

    const addTableColumn = () => {
        setForm((prev) => ({
            ...prev,
            tableHeaders: [...prev.tableHeaders, `Column ${prev.tableHeaders.length + 1}`],
            tableRows: prev.tableRows.map((row) => [...row, ""]),
        }));
    };

    const removeTableColumn = (index: number) => {
        setForm((prev) => {
            if (prev.tableHeaders.length <= 1) {
                return prev;
            }

            return {
                ...prev,
                tableHeaders: prev.tableHeaders.filter((_, i) => i !== index),
                tableRows: prev.tableRows.map((row) =>
                    row.filter((_, cellIndex) => cellIndex !== index)
                ),
            };
        });
    };

    const addTableRow = () => {
        setForm((prev) => ({
            ...prev,
            tableRows: [...prev.tableRows, createEmptyRow(prev.tableHeaders.length)],
        }));
    };

    const removeTableRow = (rowIndex: number) => {
        setForm((prev) => ({
            ...prev,
            tableRows:
                prev.tableRows.length > 1
                    ? prev.tableRows.filter((_, index) => index !== rowIndex)
                    : prev.tableRows,
        }));
    };

    const updateCell = (rowIndex: number, colIndex: number, value: string) => {
        setForm((prev) => {
            const nextRows = prev.tableRows.map((row) => [...row]);
            nextRows[rowIndex][colIndex] = value;
            return { ...prev, tableRows: nextRows };
        });
    };

    const addMapping = () => {
        setForm((prev) => ({
            ...prev,
            evaluationMappings: [
                ...prev.evaluationMappings,
                { fieldPath: "", label: "", expectedValue: "", weight: 1 },
            ],
        }));
    };

    const updateMapping = (
        index: number,
        key: keyof EvaluationMapping,
        value: string | number
    ) => {
        setForm((prev) => ({
            ...prev,
            evaluationMappings: prev.evaluationMappings.map((mapping, mappingIndex) =>
                mappingIndex === index ? { ...mapping, [key]: value } : mapping
            ),
        }));
    };

    const removeMapping = (index: number) => {
        setForm((prev) => ({
            ...prev,
            evaluationMappings:
                prev.evaluationMappings.length > 1
                    ? prev.evaluationMappings.filter(
                          (_, mappingIndex) => mappingIndex !== index
                      )
                    : prev.evaluationMappings,
        }));
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
                                    Configure prompts, evidence tables, images, and ground truth
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
                                        setSelectedSubmoduleId(event.target.value);
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
                                <Badge variant="secondary">
                                    {questions.length}
                                </Badge>
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
                                            onClick={() => openQuestion(question)}
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
                                                    {question.has_table && (
                                                        <TableProperties className="h-4 w-4 text-slate-400" />
                                                    )}
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
                                <h2 className="text-base font-semibold text-slate-900">
                                    {editingQuestionId ? "Edit Question" : "New Question"}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Author the prompt and map its correct answers for evaluation.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {editingQuestionId && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" className="gap-2 text-red-600">
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
                                                    This removes the question and its evaluation criteria.
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
                                    Save Question
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
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                            <TableProperties className="h-4 w-4 text-slate-500" />
                                            Evidence Table
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            Add structured details such as PAN, DOB, address, or source data.
                                        </p>
                                    </div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                        <input
                                            type="checkbox"
                                            checked={form.hasTable}
                                            onChange={(event) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    hasTable: event.target.checked,
                                                }))
                                            }
                                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        Include table
                                    </label>
                                </div>

                                {form.hasTable && (
                                    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={addTableColumn}
                                            >
                                                Add Column
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={addTableRow}
                                            >
                                                Add Row
                                            </Button>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="min-w-full border-collapse">
                                                <thead>
                                                    <tr>
                                                        {form.tableHeaders.map((header, index) => (
                                                            <th
                                                                key={`${header}-${index}`}
                                                                className="border border-slate-200 bg-white p-2 align-top"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <Input
                                                                        value={header}
                                                                        onChange={(event) =>
                                                                            updateHeader(
                                                                                index,
                                                                                event.target.value
                                                                            )
                                                                        }
                                                                        placeholder={`Column ${index + 1}`}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            removeTableColumn(index)
                                                                        }
                                                                        className="text-slate-400 transition hover:text-red-600"
                                                                        aria-label="Remove column"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </th>
                                                        ))}
                                                        <th className="w-12 border border-slate-200 bg-white p-2" />
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {form.tableRows.map((row, rowIndex) => (
                                                        <tr key={`row-${rowIndex}`}>
                                                            {row.map((cell, colIndex) => (
                                                                <td
                                                                    key={`cell-${rowIndex}-${colIndex}`}
                                                                    className="border border-slate-200 bg-white p-2"
                                                                >
                                                                    <Input
                                                                        value={cell}
                                                                        onChange={(event) =>
                                                                            updateCell(
                                                                                rowIndex,
                                                                                colIndex,
                                                                                event.target.value
                                                                            )
                                                                        }
                                                                        placeholder="Value"
                                                                    />
                                                                </td>
                                                            ))}
                                                            <td className="border border-slate-200 bg-white p-2 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeTableRow(rowIndex)
                                                                    }
                                                                    className="text-slate-400 transition hover:text-red-600"
                                                                    aria-label="Remove row"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
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

                            <Separator />

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                            <Target className="h-4 w-4 text-slate-500" />
                                            Evaluation Criteria
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            Map simulation field paths to the correct answers used for scoring.
                                        </p>
                                    </div>
                                    <Button type="button" variant="outline" onClick={addMapping}>
                                        Add Mapping
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {form.evaluationMappings.map((mapping, index) => (
                                        <div
                                            key={`mapping-${index}`}
                                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                        >
                                            <div className="mb-3 flex items-center justify-between">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    Mapping {index + 1}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => removeMapping(index)}
                                                    className="text-slate-400 transition hover:text-red-600"
                                                    aria-label="Remove mapping"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-medium text-slate-700">
                                                        Simulation Field Path
                                                    </label>
                                                    <Input
                                                        value={mapping.fieldPath}
                                                        onChange={(event) =>
                                                            updateMapping(
                                                                index,
                                                                "fieldPath",
                                                                event.target.value
                                                            )
                                                        }
                                                        placeholder="personalDetails.firstName"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-medium text-slate-700">
                                                        Admin Label
                                                    </label>
                                                    <Input
                                                        value={mapping.label}
                                                        onChange={(event) =>
                                                            updateMapping(
                                                                index,
                                                                "label",
                                                                event.target.value
                                                            )
                                                        }
                                                        placeholder="First Name"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-medium text-slate-700">
                                                        Expected Value
                                                    </label>
                                                    <Input
                                                        value={mapping.expectedValue}
                                                        onChange={(event) =>
                                                            updateMapping(
                                                                index,
                                                                "expectedValue",
                                                                event.target.value
                                                            )
                                                        }
                                                        placeholder="Rajesh"
                                                    />
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-medium text-slate-700">
                                                        Weight
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        step="0.5"
                                                        value={mapping.weight ?? 1}
                                                        onChange={(event) =>
                                                            updateMapping(
                                                                index,
                                                                "weight",
                                                                Number(event.target.value) || 0
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
