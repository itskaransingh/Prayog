"use client";

import * as React from "react";
import { Editor, type EditorTextChangeEvent } from "primereact/editor";

import { sanitizeRichTextHtml } from "@/lib/questions/rich-text";

interface RichTextEditorProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function RichTextEditor({
    label,
    value,
    onChange,
    placeholder,
    disabled = false,
}: RichTextEditorProps) {
    const safeValue = React.useMemo(() => sanitizeRichTextHtml(value), [value]);

    const handleTextChange = React.useCallback(
        (event: EditorTextChangeEvent) => {
            onChange(sanitizeRichTextHtml(event.htmlValue ?? ""));
        },
        [onChange],
    );

    const headerTemplate = (
        <>
            <span className="ql-formats">
                <select
                    defaultValue=""
                    className="ql-header"
                    aria-label="Heading level"
                >
                    <option value="">Normal</option>
                    <option value="1">Heading 1</option>
                    <option value="2">Heading 2</option>
                    <option value="3">Heading 3</option>
                </select>
            </span>
            <span className="ql-formats">
                <button type="button" className="ql-bold" aria-label="Bold" />
                <button type="button" className="ql-italic" aria-label="Italic" />
                <button type="button" className="ql-underline" aria-label="Underline" />
                <button type="button" className="ql-list" value="ordered" aria-label="Ordered List" />
                <button type="button" className="ql-list" value="bullet" aria-label="Bullet List" />
                <button type="button" className="ql-link" aria-label="Insert Link" />
                <button type="button" className="ql-blockquote" aria-label="Blockquote" />
                <button type="button" className="ql-code-block" aria-label="Code Block" />
                <button type="button" className="ql-clean" aria-label="Clear Formatting" />
            </span>
        </>
    );

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{label}</label>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <Editor
                    value={safeValue}
                    onTextChange={handleTextChange}
                    readOnly={disabled}
                    placeholder={placeholder ?? "Add formatted description..."}
                    headerTemplate={headerTemplate}
                    formats={[
                        "header",
                        "bold",
                        "italic",
                        "underline",
                        "list",
                        "link",
                        "blockquote",
                        "code-block",
                    ]}
                    style={{ height: "320px" }}
                />
            </div>
        </div>
    );
}
