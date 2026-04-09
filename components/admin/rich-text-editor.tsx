"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { sanitizeRichTextHtml } from "@/lib/questions/rich-text";

interface RichTextEditorProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

type EditorCommand = "bold" | "italic" | "underline" | "insertUnorderedList" | "insertOrderedList";

export function RichTextEditor({
    label,
    value,
    onChange,
    placeholder,
    disabled = false,
}: RichTextEditorProps) {
    const editorRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        const editor = editorRef.current;
        if (!editor) {
            return;
        }

        const normalizedIncoming = sanitizeRichTextHtml(value);
        const normalizedCurrent = sanitizeRichTextHtml(editor.innerHTML);
        if (normalizedIncoming !== normalizedCurrent) {
            editor.innerHTML = normalizedIncoming;
        }
    }, [value]);

    const emitChange = React.useCallback(() => {
        const editor = editorRef.current;
        if (!editor) {
            return;
        }

        onChange(sanitizeRichTextHtml(editor.innerHTML));
    }, [onChange]);

    const runCommand = React.useCallback(
        (command: EditorCommand) => {
            if (disabled) {
                return;
            }

            editorRef.current?.focus();
            document.execCommand(command);
            emitChange();
        },
        [disabled, emitChange],
    );

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{label}</label>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                        onClick={() => runCommand("bold")}
                    >
                        Bold
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                        onClick={() => runCommand("italic")}
                    >
                        Italic
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                        onClick={() => runCommand("underline")}
                    >
                        Underline
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                        onClick={() => runCommand("insertUnorderedList")}
                    >
                        Bullet List
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                        onClick={() => runCommand("insertOrderedList")}
                    >
                        Numbered List
                    </Button>
                </div>
                <div
                    ref={editorRef}
                    contentEditable={!disabled}
                    suppressContentEditableWarning
                    onInput={emitChange}
                    data-placeholder={placeholder ?? "Add formatted description..."}
                    className="min-h-40 px-4 py-3 text-sm leading-6 text-slate-700 outline-none empty:before:pointer-events-none empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)]"
                />
            </div>
        </div>
    );
}
