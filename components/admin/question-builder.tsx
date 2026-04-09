"use client";

import { AlertCircle, ImageIcon, Loader2 } from "lucide-react";

import { QAEditor } from "@/components/admin/qa-editor";
import type { SimulatorType, SyncAnswersPayload } from "@/components/admin/qa-editor/types";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import type { QuestionFormState } from "./page";

interface QuestionBuilderProps {
    simulatorType: SimulatorType;
    qaPayload: SyncAnswersPayload | null;
    qaDirty: boolean;
    qaNotice: string | null;
    isLoadingAnswers: boolean;
    editingQuestionId: string | null;
    isSaving: boolean;
    showExpectedAnswersInEvaluation: boolean;
    hasImage: boolean;
    imageUrl: string;
    handleQaPayloadChange: (payload: SyncAnswersPayload | null) => void;
    setForm: React.Dispatch<React.SetStateAction<QuestionFormState>>;
}

export function QuestionBuilder({
    simulatorType,
    qaPayload,
    qaDirty,
    qaNotice,
    isLoadingAnswers,
    editingQuestionId,
    isSaving,
    showExpectedAnswersInEvaluation,
    hasImage,
    imageUrl,
    handleQaPayloadChange,
    setForm,
}: QuestionBuilderProps) {
    return (
        <>
         

            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                        Add Question and Answer
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
                    <div className="space-y-3">
                        {qaNotice ? (
                            <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                                <span>{qaNotice}</span>
                            </div>
                        ) : null}
                        {!editingQuestionId && qaPayload !== null ? (
                            <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                                Unsaved answers
                            </div>
                        ) : null}
                        <QAEditor
                            key={`${editingQuestionId ?? "new"}:${simulatorType ?? "none"}`}
                            simulatorType={simulatorType ?? "none"}
                            initialPayload={qaPayload}
                            onChange={handleQaPayloadChange}
                            disabled={isSaving}
                            fieldsLocked={
                                simulatorType === "itr_registration" ||
                                simulatorType === "epan_registration"
                            }
                        />
                    </div>
                )}
            </div>

            <div className="my-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                            Evaluation Popup
                        </h3>
                        <p className="text-sm text-slate-500">
                            Decide whether learners should see the
                            authored expected answers after completing
                            the simulator.
                        </p>
                    </div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <input
                            type="checkbox"
                            checked={showExpectedAnswersInEvaluation}
                            onChange={(event) =>
                                setForm((prev) => ({
                                    ...prev,
                                    showExpectedAnswersInEvaluation:
                                        event.target.checked,
                                }))
                            }
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Show expected answers
                    </label>
                </div>
            </div>

         
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
                            checked={hasImage}
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

                {hasImage && (
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Image URL
                            </label>
                            <Input
                                value={imageUrl}
                                onChange={(event) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        imageUrl: event.target.value,
                                    }))
                                }
                                placeholder="https://..."
                            />
                        </div>
                        {imageUrl.trim() && (
                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Preview
                                </p>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={imageUrl}
                                    alt="Question asset preview"
                                    className="max-h-72 rounded-lg border border-slate-200 object-contain"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}