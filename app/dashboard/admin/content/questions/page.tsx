"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    AlertCircle,
    ArrowLeft,
    ChevronDown,
    FileText,
    ImageIcon,
    LayoutList,
    Link2,
    Loader2,
    Plus,
    Save,
    Trash2,
    Video,
    X,
} from "lucide-react";

import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { QuestionBuilder } from "@/components/admin/question-builder";
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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    getQuestionTypeLabel,
    isTaskQuestionType,
    type QuestionType,
} from "@/lib/questions/types";

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
    content_html: string;
    upper_body_html: string | null;
    lower_body_html: string | null;
    has_table: boolean;
    table_data: {
        headers?: string[];
        rows?: string[][];
    } | null;
    has_image: boolean;
    image_url: string | null;
    type: QuestionType;
    resource_description: string | null;
    course_objectives: string[];
    video_url: string | null;
    link_url: string | null;
    link_title: string | null;
}

interface QuestionFormState {
    title: string;
    contentHtml: string;
    upperBodyHtml: string;
    lowerBodyHtml: string;
    hasImage: boolean;
    imageUrl: string;
    type: QuestionType;
    courseObjectives: string[];
    videoUrl: string;
    linkUrl: string;
    linkTitle: string;
    showExpectedAnswersInEvaluation: boolean;
}

interface SimulationTaskRecord {
    id: string;
    question_id: string;
    show_expected_answers_in_evaluation: boolean;
}

function getEmptyQuestionForm(): QuestionFormState {
    return {
        title: "",
        contentHtml: "",
        upperBodyHtml: "",
        lowerBodyHtml: "",
        hasImage: false,
        imageUrl: "",
        type: "question",
        courseObjectives: [],
        videoUrl: "",
        linkUrl: "",
        linkTitle: "",
        showExpectedAnswersInEvaluation: false,
    };
}

const COURSE_OBJECTIVE_OPTIONS = ["CO1", "CO2", "CO3", "CO4", "CO5", "CO6"] as const;

function getFormMode(type: QuestionType): "question" | "resource" {
    return type === "question" ? "question" : "resource";
}

function getItemLabel(type: QuestionType): string {
    return type === "question" ? "Task" : getQuestionTypeLabel(type);
}

function getTaskNumber(items: Question[], targetId: string): number | null {
    let taskNumber = 0;

    for (const item of items) {
        if (item.type === "question") {
            taskNumber += 1;
        }

        if (item.id === targetId) {
            return item.type === "question" ? taskNumber : null;
        }
    }

    return null;
}

function normalizeFormForType(
    previous: QuestionFormState,
    nextType: QuestionType,
): QuestionFormState {
    if (nextType === "question") {
        return {
            ...previous,
            type: "question",
            videoUrl: "",
            linkUrl: "",
            linkTitle: "",
        };
    }

    if (nextType === "video") {
        return {
            ...previous,
            type: "video",
            hasImage: false,
            imageUrl: "",
            linkUrl: "",
            linkTitle: "",
        };
    }

    return {
        ...previous,
        type: "document",
        hasImage: false,
        imageUrl: "",
        videoUrl: "",
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
    const [, setEditingSimulationTaskId] = useState<string | null>(null);
    const [form, setForm] = useState<QuestionFormState>(getEmptyQuestionForm);
    const [qaPayload, setQaPayload] = useState<SyncAnswersPayload | null>(null);
    const [loadedQaPayload, setLoadedQaPayload] = useState<SyncAnswersPayload | null>(null);
    const [qaDirty, setQaDirty] = useState(false);
    const [qaNotice, setQaNotice] = useState<string | null>(null);
    const [isLoadingModules, setIsLoadingModules] = useState(true);
    const [isLoadingSubmodules, setIsLoadingSubmodules] = useState(false);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
    const [isLoadingAnswers, setIsLoadingAnswers] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showUpperBody, setShowUpperBody] = useState(false);
    const [showLowerBody, setShowLowerBody] = useState(false);
    const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);

    const formMode = useMemo(() => getFormMode(form.type), [form.type]);
    const selectedSubmodule =
        submodules.find((submodule) => submodule.id === selectedSubmoduleId) ?? null;
    const simulatorTypeLabel = simulatorType ?? "none";
    const simulatorTypeMissing =
        Boolean(selectedSubmoduleId) &&
        (simulatorType === null || simulatorType === "none");

    const isEmptyQaPayload = useCallback(
        (payload: SyncAnswersPayload | null, type: SimulatorType | null) => {
            if (!payload) {
                return true;
            }

            switch (payload.type) {
                case "classification":
                    return (
                        payload.options.length === 0 &&
                        payload.rows.every(
                            (row) => !row.label.trim() && !row.expected.trim(),
                        )
                    );
                case "grid":
                    return (
                        payload.accountOptions.length === 0 &&
                        payload.rows.every(
                            (row) =>
                                !row.transactionDesc.trim() &&
                                !row.drAccount.trim() &&
                                !row.drAmount.trim() &&
                                !row.crAccount.trim() &&
                                !row.crAmount.trim(),
                        )
                    );
                case "journal_entry":
                    return (
                        payload.accountOptions.length === 0 &&
                        payload.rows.every(
                            (row) =>
                                !row.transactionDesc.trim() &&
                                row.lines.every(
                                    (line) =>
                                        !line.account.trim() &&
                                        !line.amount.trim(),
                                ),
                        )
                    );
                case "ledger":
                    return (
                        payload.accountOptions.length === 0 &&
                        payload.rows.every(
                            (row) =>
                                !row.transactionDesc.trim() &&
                                row.debitRows.every(
                                    (line) =>
                                        !line.account.trim() &&
                                        !line.amount.trim(),
                                ) &&
                                row.creditRows.every(
                                    (line) =>
                                        !line.account.trim() &&
                                        !line.amount.trim(),
                                ),
                        )
                    );
                case "trial_balance":
                    return (
                        payload.accountOptions.length === 0 &&
                        payload.rows.every(
                            (row) => !row.account.trim() && !row.amount.trim(),
                        )
                    );
                case "financial_statement":
                    return payload.sections.every(
                        (section) =>
                            section.options.length === 0 &&
                            section.rows.every(
                                (row) => !row.account.trim() && !row.amount.trim(),
                            ),
                    );
                case "registration":
                    return payload.fields.length === 0;
                default:
                    return type === "none";
            }
        },
        [],
    );

    const handleQaPayloadChange = useCallback(
        (nextPayload: SyncAnswersPayload | null) => {
            if (editingQuestionId && !qaDirty) {
                const loadedSignature = JSON.stringify(loadedQaPayload);
                const nextSignature = JSON.stringify(nextPayload);

                if (loadedSignature === nextSignature) {
                    setQaPayload(nextPayload);
                    return;
                }

                if (loadedQaPayload === null && isEmptyQaPayload(nextPayload, simulatorType)) {
                    return;
                }
            }

            setQaPayload(nextPayload);
            setQaDirty(true);
        },
        [editingQuestionId, isEmptyQaPayload, loadedQaPayload, qaDirty, simulatorType],
    );

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
                throw new Error(data.error || "Failed to fetch tasks");
            }

            setQuestions(data.questions || []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to fetch tasks");
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
        setEditingSimulationTaskId(null);
        setForm(getEmptyQuestionForm());
        setQaPayload(null);
        setLoadedQaPayload(null);
        setQaDirty(false);
        setQaNotice(null);
        setIsLoadingAnswers(false);
        setShowUpperBody(false);
        setShowLowerBody(false);
        setShowQuestionBuilder(false);
    }, []);

    const openQuestion = useCallback(
        async (question: Question, options?: { preserveStatus?: boolean }) => {
            const derivedUpperBody = question.upper_body_html || question.content_html || question.paragraph || question.resource_description || "";
            setEditingQuestionId(question.id);
            setForm({
                title: question.title,
                upperBodyHtml: derivedUpperBody,
                contentHtml: "",
                lowerBodyHtml: question.lower_body_html || "",
                hasImage: question.has_image,
                imageUrl: question.image_url || "",
                type: question.type ?? "question",
                courseObjectives: question.course_objectives || [],
                videoUrl: question.video_url || "",
                linkUrl: question.link_url || "",
                linkTitle: question.link_title || "",
                showExpectedAnswersInEvaluation: false,
            });
            setQaPayload(null);
            setLoadedQaPayload(null);
            setQaDirty(false);
            setQaNotice(null);
            setEditingSimulationTaskId(null);
            setShowUpperBody(Boolean(derivedUpperBody));
            setShowLowerBody(Boolean(question.lower_body_html));
            setShowQuestionBuilder(true);

            if (!options?.preserveStatus) {
                setSuccessMessage(null);
                setError(null);
            }

            if (!isTaskQuestionType(question.type)) {
                setIsLoadingAnswers(false);
                return;
            }

            setIsLoadingAnswers(true);

            try {
                const [answersRes, simulationTaskRes] = await Promise.all([
                    fetch(`/api/admin/questions/${question.id}/answers`),
                    fetch(`/api/admin/simulation-tasks?questionId=${question.id}`),
                ]);
                const [answersData, simulationTaskData] = await Promise.all([
                    answersRes.json(),
                    simulationTaskRes.json(),
                ]);

                if (!answersRes.ok) {
                    console.error("Failed to load question answers", {
                        questionId: question.id,
                        status: answersRes.status,
                        payload: answersData,
                    });
                    throw new Error(answersData.error || "Failed to load question answers");
                }

                if (!simulationTaskRes.ok) {
                    console.error("Failed to load simulation task settings", {
                        questionId: question.id,
                        status: simulationTaskRes.status,
                        payload: simulationTaskData,
                    });
                    throw new Error(
                        simulationTaskData.error || "Failed to load simulation task settings",
                    );
                }

                const simulationTask =
                    (simulationTaskData.tasks?.[0] as SimulationTaskRecord | undefined) ??
                    null;

                setEditingSimulationTaskId(simulationTask?.id ?? null);
                setForm((prev) => ({
                    ...prev,
                    showExpectedAnswersInEvaluation:
                        simulationTask?.show_expected_answers_in_evaluation ?? false,
                }));

                const nextSimulatorType =
                    answersData.simulatorType ?? simulatorType ?? "none";

                setQaPayload(answersData.answers ?? null);
                setLoadedQaPayload(answersData.answers ?? null);
                setQaDirty(false);
                setQaNotice(
                    answersData.answers === null && nextSimulatorType !== "none"
                        ? "No answers saved yet. Add your expected answers below."
                        : null,
                );
                setSimulatorType(nextSimulatorType);
            } catch (err: unknown) {
                setQaNotice(null);
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
            setError("Select a submodule and provide a title.");
            return;
        }

        if (form.type === "video" && !form.videoUrl.trim()) {
            setError("Provide a YouTube URL for the video resource.");
            return;
        }

        if (form.type === "document" && !form.linkUrl.trim()) {
            setError("Provide a document URL for the document resource.");
            return;
        }

        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);
        setQaNotice(null);

        let savedQuestion: Question | null = null;

        try {
            const trimmedContentHtml = form.contentHtml.trim();
            const legacyParagraph =
                form.type === "question" ? trimmedContentHtml : "";
            const legacyResourceDescription =
                form.type === "question" ? null : trimmedContentHtml || null;
            const questionPayload = {
                title: form.title.trim(),
                paragraph: legacyParagraph,
                content_html: trimmedContentHtml,
                upper_body_html: form.upperBodyHtml.trim() || null,
                lower_body_html: form.lowerBodyHtml.trim() || null,
                has_image: form.type === "question" ? form.hasImage : false,
                image_url:
                    form.type === "question" && form.hasImage
                        ? form.imageUrl.trim()
                        : null,
                type: form.type,
                resource_description: legacyResourceDescription,
                course_objectives: form.courseObjectives,
                video_url: form.type === "video" ? form.videoUrl.trim() : null,
                link_url: form.type === "document" ? form.linkUrl.trim() : null,
                link_title:
                    form.type === "document" ? form.linkTitle.trim() || null : null,
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
                throw new Error(questionData.error || "Failed to save task");
            }

            savedQuestion = questionData.question ?? null;
            if (!savedQuestion?.id) {
                throw new Error("Task was not returned by the API");
            }
            const savedQuestionId = savedQuestion.id;

            if (
                form.type === "question" &&
                qaPayload !== null &&
                !isEmptyQaPayload(qaPayload, simulatorType) &&
                (!editingQuestionId || qaDirty)
            ) {
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

            if (form.type === "question") {
                const existingTaskRes = await fetch(
                    `/api/admin/simulation-tasks?questionId=${savedQuestionId}`,
                );
                const existingTaskData = await existingTaskRes.json();

                if (!existingTaskRes.ok) {
                    throw new Error(
                        existingTaskData.error ||
                            "Failed to load simulation task settings",
                    );
                }

                const existingTask =
                    (existingTaskData.tasks?.[0] as SimulationTaskRecord | undefined) ??
                    null;

                const refreshCurrentTask = async () => {
                    const taskLookupRes = await fetch(
                        `/api/admin/simulation-tasks?questionId=${savedQuestionId}`,
                    );
                    const taskLookupData = await taskLookupRes.json();

                    if (!taskLookupRes.ok) {
                        throw new Error(
                            taskLookupData.error ||
                                "Failed to load simulation task settings",
                        );
                    }

                    return (
                        (taskLookupData.tasks?.[0] as SimulationTaskRecord | undefined) ??
                        null
                    );
                };

                if (existingTask?.id) {
                    const taskRes = await fetch(
                        `/api/admin/simulation-tasks/${existingTask.id}`,
                        {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                show_expected_answers_in_evaluation:
                                    form.showExpectedAnswersInEvaluation,
                            }),
                        },
                    );
                    const taskData = await taskRes.json();

                    if (!taskRes.ok) {
                        throw new Error(
                            taskData.error ||
                                "Failed to update evaluation answer visibility",
                        );
                    }

                    setEditingSimulationTaskId(taskData.task?.id ?? existingTask.id);
                } else if (form.showExpectedAnswersInEvaluation) {
                    const taskRes = await fetch("/api/admin/simulation-tasks", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            question_id: savedQuestionId,
                            show_expected_answers_in_evaluation: true,
                        }),
                    });
                    const taskData = await taskRes.json();

                    if (!taskRes.ok && taskRes.status !== 409) {
                        throw new Error(
                            taskData.error ||
                                "Failed to save evaluation answer visibility",
                        );
                    }

                    if (taskRes.ok) {
                        setEditingSimulationTaskId(taskData.task?.id ?? null);
                    } else {
                        const refreshedTask = await refreshCurrentTask();
                        setEditingSimulationTaskId(refreshedTask?.id ?? null);
                    }
                } else {
                    setEditingSimulationTaskId(null);
                }
            }

            setSuccessMessage(
                form.type === "question"
                    ? "Task and answers saved."
                    : `${getQuestionTypeLabel(form.type)} saved.`,
            );
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
                throw new Error(data.error || "Failed to delete task");
            }

            if (selectedSubmoduleId) {
                await fetchQuestions(selectedSubmoduleId);
            }

            if (editingQuestionId === questionId) {
                resetForm();
            }

            setSuccessMessage("Item deleted.");
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
                                    Tasks
                                </h1>
                                <p className="text-xs text-slate-500">
                                    Manage task prompts, videos, and document resources
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/admin/content/modules">
                            <Button variant="outline">Manage Modules</Button>
                        </Link>
                        <TooltipProvider>
                            {simulatorTypeMissing ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="inline-flex">
                                            <Button
                                                onClick={() => {
                                                    resetForm();
                                                    setSuccessMessage(null);
                                                    setError(null);
                                                }}
                                                disabled
                                                className="gap-2"
                                            >
                                                <Plus className="h-4 w-4" />
                                                New Item
                                            </Button>
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Set simulator type first
                                    </TooltipContent>
                                </Tooltip>
                            ) : (
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
                                    New Item
                                </Button>
                            )}
                        </TooltipProvider>
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
                            Choose the submodule that owns these tasks and resources.
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
                                <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                                    {!selectedModuleId ? (
                                        <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
                                            Select a module first.
                                        </div>
                                    ) : isLoadingSubmodules ? (
                                        <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
                                            Loading submodules...
                                        </div>
                                    ) : submodules.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
                                            No submodules found for this module.
                                        </div>
                                    ) : (
                                        <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                                            {submodules.map((submodule) => {
                                                const isSelected =
                                                    selectedSubmoduleId === submodule.id;

                                                return (
                                                    <button
                                                        key={submodule.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedSubmoduleId(
                                                                submodule.id,
                                                            );
                                                            setSimulatorType(
                                                                submodule.simulator_type ??
                                                                    null,
                                                            );
                                                            resetForm();
                                                        }}
                                                        className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition ${
                                                            isSelected
                                                                ? "border-emerald-300 bg-emerald-50"
                                                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                                        }`}
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium text-slate-900">
                                                                {submodule.title}
                                                            </p>
                                                            <p className="truncate text-xs text-slate-500">
                                                                {submodule.slug}
                                                            </p>
                                                        </div>
                                                        <Badge variant="outline" className="shrink-0">
                                                            {submodule.simulator_type ??
                                                                "none"}
                                                        </Badge>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between gap-2 px-1 pt-1 text-xs text-slate-500">
                                    <span>
                                        Selected submodule:
                                        {selectedSubmodule
                                            ? ` ${selectedSubmodule.title}`
                                            : " none"}
                                    </span>
                                    <Badge variant="outline" className="h-6">
                                        Simulator: {simulatorTypeLabel}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-5 py-4">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-sm font-semibold text-slate-900">
                                        Tasks & Resources
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Existing items for the selected submodule.
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
                                    Pick a submodule to load items.
                                </div>
                            ) : questions.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                                    No items yet for this submodule.
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
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                        {question.type === "question"
                                                            ? `Task ${getTaskNumber(questions, question.id) ?? index + 1}`
                                                            : getItemLabel(question.type)}
                                                    </p>
                                                    <p className="mt-1 font-medium text-slate-900">
                                                        {question.title}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">
                                                        {getQuestionTypeLabel(
                                                            question.type ?? "question",
                                                        )}
                                                    </Badge>
                                                    {question.type === "question" &&
                                                        question.has_image && (
                                                            <ImageIcon className="h-4 w-4 text-slate-400" />
                                                        )}
                                                    {question.type === "video" && (
                                                        <Video className="h-4 w-4 text-slate-400" />
                                                    )}
                                                    {question.type === "document" && (
                                                        <FileText className="h-4 w-4 text-slate-400" />
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
                                        {editingQuestionId
                                            ? `Edit ${getItemLabel(form.type)}`
                                            : "Create Item"}
                                    </h2>
                                    <Badge variant="outline">
                                        {simulatorTypeLabel}
                                    </Badge>
                                </div>
                                <p className="text-sm text-slate-500">
                                    Build either a simulator task or a supporting learning resource.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-8 px-6 py-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">
                                        Task Type
                                    </label>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <label className={`rounded-2xl border p-4 transition ${
                                            formMode === "question"
                                                ? "border-emerald-300 bg-emerald-50"
                                                : "border-slate-200 bg-white"
                                        }`}>
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="radio"
                                                    name="itemMode"
                                                    checked={formMode === "question"}
                                                    onChange={() =>
                                                        setForm((prev) =>
                                                            normalizeFormForType(
                                                                prev,
                                                                "question",
                                                            ),
                                                        )
                                                    }
                                                    className="mt-1 h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <div>
                                                    <p className="font-medium text-slate-900">
                                                        Add question and answer
                                                    </p>
                                                    <p className="text-sm text-slate-500">
                                                        Create a simulator task with prompt, image, and answer mapping.
                                                    </p>
                                                </div>
                                            </div>
                                        </label>

                                        <label className={`rounded-2xl border p-4 transition ${
                                            formMode === "resource"
                                                ? "border-emerald-300 bg-emerald-50"
                                                : "border-slate-200 bg-white"
                                        }`}>
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="radio"
                                                    name="itemMode"
                                                    checked={formMode === "resource"}
                                                    onChange={() =>
                                                        setForm((prev) =>
                                                            normalizeFormForType(prev, "video"),
                                                        )
                                                    }
                                                    className="mt-1 h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <div>
                                                    <p className="font-medium text-slate-900">
                                                        Add resource
                                                    </p>
                                                    <p className="text-sm text-slate-500">
                                                        Add a YouTube explainer or a document resource for the learner.
                                                    </p>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {formMode === "resource" && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Resource Type
                                        </label>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            <label className={`rounded-2xl border p-4 transition ${
                                                form.type === "video"
                                                    ? "border-emerald-300 bg-emerald-50"
                                                    : "border-slate-200 bg-white"
                                            }`}>
                                                <div className="flex items-start gap-3">
                                                    <input
                                                        type="radio"
                                                        name="resourceType"
                                                        checked={form.type === "video"}
                                                        onChange={() =>
                                                            setForm((prev) =>
                                                                normalizeFormForType(prev, "video"),
                                                            )
                                                        }
                                                        className="mt-1 h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-slate-900">
                                                            YouTube video
                                                        </p>
                                                        <p className="text-sm text-slate-500">
                                                            Embed the video directly inside case study content.
                                                        </p>
                                                    </div>
                                                </div>
                                            </label>

                                            <label className={`rounded-2xl border p-4 transition ${
                                                form.type === "document"
                                                    ? "border-emerald-300 bg-emerald-50"
                                                    : "border-slate-200 bg-white"
                                            }`}>
                                                <div className="flex items-start gap-3">
                                                    <input
                                                        type="radio"
                                                        name="resourceType"
                                                        checked={form.type === "document"}
                                                        onChange={() =>
                                                            setForm((prev) =>
                                                                normalizeFormForType(
                                                                    prev,
                                                                    "document",
                                                                ),
                                                            )
                                                        }
                                                        className="mt-1 h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-slate-900">
                                                            Document
                                                        </p>
                                                        <p className="text-sm text-slate-500">
                                                            Keep the LMS document card UI, backed by a document link.
                                                        </p>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">
                                        {form.type === "question"
                                            ? "Task Title"
                                            : "Resource Title"}
                                    </label>
                                    <Input
                                        value={form.title}
                                        onChange={(event) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                title: event.target.value,
                                            }))
                                        }
                                        placeholder={
                                            form.type === "question"
                                                ? "e.g. ITR Registration for Resident Individual"
                                                : "e.g. E-PAN User Guide"
                                        }
                                    />
                                </div>

                                {form.type === "question" && (
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            Course Objectives
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {COURSE_OBJECTIVE_OPTIONS.map((objective) => {
                                                const isSelected =
                                                    form.courseObjectives.includes(objective);

                                                return (
                                                    <label
                                                        key={objective}
                                                        className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                                                            isSelected
                                                                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                                                : "border-slate-200 bg-white text-slate-600"
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(event) =>
                                                                setForm((prev) => ({
                                                                    ...prev,
                                                                    courseObjectives:
                                                                        event.target.checked
                                                                            ? [
                                                                                  ...prev.courseObjectives,
                                                                                  objective,
                                                                              ]
                                                                            : prev.courseObjectives.filter(
                                                                                  (value) =>
                                                                                      value !==
                                                                                      objective,
                                                                              ),
                                                                }))
                                                            }
                                                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                        />
                                                        {objective}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {showUpperBody ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-slate-900">
                                                Upper Body
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() => setShowUpperBody(false)}
                                                className="text-sm text-slate-500 hover:text-red-600"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <RichTextEditor
                                            label=""
                                            value={form.upperBodyHtml}
                                            onChange={(value) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    upperBodyHtml: value,
                                                }))
                                            }
                                            placeholder="Add content that appears before the task question..."
                                            disabled={isSaving}
                                        />
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowUpperBody(true)}
                                        className="w-full rounded-2xl border-2 border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 transition hover:border-emerald-400 hover:text-emerald-600"
                                    >
                                        + Add Upper Body
                                    </button>
                                )}

                                </div>

                            {form.type === "question" && (
                                <div className="rounded-2xl border border-slate-200 bg-white">
                                    <button
                                        type="button"
                                        onClick={() => setShowQuestionBuilder(!showQuestionBuilder)}
                                        className="flex w-full items-center justify-between px-6 py-4 text-left"
                                    >
                                        <span className="font-semibold text-slate-900">Question Builder</span>
                                        <ChevronDown
                                            className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${showQuestionBuilder ? "rotate-180" : ""}`}
                                        />
                                    </button>
                                    {showQuestionBuilder && (
                                        <div className="border-t border-slate-100 px-6 py-6">
                                            <QuestionBuilder
                                                simulatorType={simulatorType ?? "none"}
                                                qaPayload={qaPayload}
                                                qaDirty={qaDirty}
                                                qaNotice={qaNotice}
                                                isLoadingAnswers={isLoadingAnswers}
                                                editingQuestionId={editingQuestionId}
                                                isSaving={isSaving}
                                                showExpectedAnswersInEvaluation={form.showExpectedAnswersInEvaluation}
                                                hasImage={form.hasImage}
                                                imageUrl={form.imageUrl}
                                                handleQaPayloadChange={handleQaPayloadChange}
                                                setForm={setForm}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {form.type !== "question" && (
                                <>
                                    <Separator />

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-900">
                                                Resource Link
                                            </h3>
                                            <p className="text-sm text-slate-500">
                                                {form.type === "video"
                                                    ? "Use a YouTube link so the learner can watch it directly on the page."
                                                    : "Use a document URL for now. File upload is not wired in this phase."}
                                            </p>
                                        </div>

                                        {form.type === "video" ? (
                                            <div className="space-y-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                                    <Video className="h-4 w-4 text-slate-500" />
                                                    YouTube URL
                                                </label>
                                                <Input
                                                    value={form.videoUrl}
                                                    onChange={(event) =>
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            videoUrl:
                                                                event.target.value,
                                                        }))
                                                    }
                                                    placeholder="https://www.youtube.com/watch?v=..."
                                                />
                                            </div>
                                        ) : (
                                            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                                <div className="space-y-1.5">
                                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                                        <Link2 className="h-4 w-4 text-slate-500" />
                                                        Document URL
                                                    </label>
                                                    <Input
                                                        value={form.linkUrl}
                                                        onChange={(event) =>
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                linkUrl:
                                                                    event.target.value,
                                                            }))
                                                        }
                                                        placeholder="https://..."
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-sm font-medium text-slate-700">
                                                        Document Display Title
                                                    </label>
                                                    <Input
                                                        value={form.linkTitle}
                                                        onChange={(event) =>
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                linkTitle:
                                                                    event.target.value,
                                                            }))
                                                        }
                                                        placeholder="e.g. E-PAN User Guide.pdf"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {showLowerBody ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-slate-900">
                                            Lower Body
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowLowerBody(false)}
                                            className="text-sm text-slate-500 hover:text-red-600"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    <RichTextEditor
                                        label=""
                                        value={form.lowerBodyHtml}
                                        onChange={(value) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                lowerBodyHtml: value,
                                            }))
                                        }
                                        placeholder="Add content that appears after the task..."
                                        disabled={isSaving}
                                    />
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowLowerBody(true)}
                                    className="w-full rounded-2xl border-2 border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 transition hover:border-emerald-400 hover:text-emerald-600"
                                >
                                    + Add Lower Body
                                </button>
                            )}

                            <Separator />

                            <div className="flex flex-wrap items-center justify-end gap-3">
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
                                                    Delete this item?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This removes the selected task or resource.
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
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
