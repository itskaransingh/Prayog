"use client";

import * as React from "react";
import { Calculator, Delete, Divide, Equal, Minus, Move, Plus, X } from "lucide-react";

type Position = { x: number; y: number };

const BUTTON_LAYOUT = [
    ["C", "DEL", "%", "DIV"],
    ["7", "8", "9", "MUL"],
    ["4", "5", "6", "SUB"],
    ["1", "2", "3", "ADD"],
    ["+/-", "0", ".", "EQ"],
] as const;

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function sanitizeExpression(value: string) {
    return value
        .replace(/×/g, "*")
        .replace(/÷/g, "/");
}

function evaluateExpression(value: string) {
    const sanitized = sanitizeExpression(value);
    if (!/^[0-9+\-*/%.() ]+$/.test(sanitized)) {
        throw new Error("Invalid expression");
    }

    const result = Function(`"use strict"; return (${sanitized})`)();
    if (typeof result !== "number" || Number.isNaN(result) || !Number.isFinite(result)) {
        throw new Error("Invalid result");
    }

    return String(result);
}

function getButtonValue(key: string) {
    if (key === "DIV") return "÷";
    if (key === "MUL") return "×";
    if (key === "SUB") return "-";
    if (key === "ADD") return "+";
    if (key === "EQ") return "=";
    return key;
}

export function DraggableCalculator() {
    const widgetRef = React.useRef<HTMLDivElement | null>(null);
    const dragOffsetRef = React.useRef<Position>({ x: 0, y: 0 });

    const [display, setDisplay] = React.useState("0");
    const [position, setPosition] = React.useState<Position>({ x: 18, y: 64 });
    const [dragging, setDragging] = React.useState(false);
    const [minimized, setMinimized] = React.useState(true);

    const moveWithinViewport = React.useCallback((clientX: number, clientY: number) => {
        const widget = widgetRef.current;
        const width = widget?.offsetWidth ?? 174;
        const height = widget?.offsetHeight ?? 265;

        setPosition({
            x: clamp(clientX - dragOffsetRef.current.x, 12, window.innerWidth - width - 12),
            y: clamp(clientY - dragOffsetRef.current.y, 12, window.innerHeight - height - 12),
        });
    }, []);

    React.useEffect(() => {
        if (!dragging) return;

        const onPointerMove = (event: PointerEvent) => moveWithinViewport(event.clientX, event.clientY);
        const onPointerUp = () => setDragging(false);

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);

        return () => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
        };
    }, [dragging, moveWithinViewport]);

    const startDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
        const widget = widgetRef.current;
        if (!widget) return;

        const rect = widget.getBoundingClientRect();
        dragOffsetRef.current = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };

        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
    };

    const handleInput = (key: string) => {
        const value = getButtonValue(key);

        if (key === "C") {
            setDisplay("0");
            return;
        }

        if (key === "DEL") {
            setDisplay((current) => (current.length <= 1 || current === "Error" ? "0" : current.slice(0, -1)));
            return;
        }

        if (key === "EQ") {
            try {
                setDisplay((current) => evaluateExpression(current));
            } catch {
                setDisplay("Error");
            }
            return;
        }

        if (key === "+/-") {
            setDisplay((current) => {
                if (current === "0" || current === "Error") return "0";
                return current.startsWith("-") ? current.slice(1) : `-${current}`;
            });
            return;
        }

        if (key === "%") {
            setDisplay((current) => {
                const parsed = Number(current);
                return Number.isNaN(parsed) ? "Error" : String(parsed / 100);
            });
            return;
        }

        setDisplay((current) => {
            const safe = current === "Error" ? "0" : current;
            if (safe === "0" && /[0-9]/.test(value)) return value;
            if (safe === "0" && value === ".") return "0.";
            return `${safe}${value}`;
        });
    };

    if (minimized) {
        return (
            <button
                type="button"
                onClick={() => setMinimized(false)}
                aria-label="Open calculator"
                className="fixed bottom-5 right-5 z-[80] flex size-14 items-center justify-center rounded-full border border-[#dfe7ff] bg-white text-[#2968ff] shadow-[0_16px_40px_rgba(30,64,175,0.18)] transition-transform hover:scale-105"
            >
                <Calculator className="size-6" />
            </button>
        );
    }

    return (
        <div
            ref={widgetRef}
            className="fixed z-[80] w-[174px] rounded-[10px] border border-[#e6eaf1] bg-white p-[10px] shadow-[0_18px_48px_rgba(15,23,42,0.16)]"
            style={{ left: position.x, top: position.y }}
        >
            <div className="mb-1 flex items-center justify-between">
                <span className="size-2.5 rounded-full bg-[#ff4f47]" />
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onPointerDown={startDrag}
                        aria-label="Drag calculator"
                        className="flex size-5 cursor-grab items-center justify-center rounded text-[#2b2f38] active:cursor-grabbing"
                    >
                        <Move className="size-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setMinimized(true)}
                        aria-label="Minimize calculator"
                        className="flex size-5 items-center justify-center rounded text-[#8a909c] hover:bg-[#f7f8fb]"
                    >
                        <Minus className="size-3.5" />
                    </button>
                </div>
            </div>

            <div className="mb-3 mt-2 flex min-h-[70px] flex-col justify-end text-right">
                <div className="text-[11px] leading-none text-[#8d95a3]">0</div>
                <div className="mt-2 text-[18px] font-medium leading-none text-[#171b23]">
                    {display === "Error" ? "Error" : display}
                </div>
            </div>

            <div className="mb-2 pl-1 text-[28px] leading-none text-[#8b919d]">=</div>

            <div className="grid gap-[9px]">
                {BUTTON_LAYOUT.map((row, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-4 gap-[9px]">
                        {row.map((key) => {
                            const label = getButtonValue(key);
                            const isDark = ["EQ"].includes(key);
                            const isAction = ["DIV", "MUL", "SUB", "ADD"].includes(key);

                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => handleInput(key)}
                                    className={[
                                        "flex h-[28px] w-[28px] items-center justify-center rounded-[3px] border text-[12px] font-medium transition-colors",
                                        isDark
                                            ? "border-[#2a313d] bg-[#222833] text-white hover:bg-[#2d3440]"
                                            : isAction
                                                ? "border-[#9ca3af] bg-[#fbfbfc] text-[#2b313d] hover:bg-[#f1f3f7]"
                                                : "border-[#edf0f5] bg-white text-[#2b313d] shadow-[0_1px_2px_rgba(15,23,42,0.06)] hover:bg-[#fafbfc]",
                                    ].join(" ")}
                                >
                                    {key === "DEL" ? <Delete className="size-3.5" strokeWidth={1.8} /> : null}
                                    {key === "DIV" ? <Divide className="size-3.5" strokeWidth={1.8} /> : null}
                                    {key === "MUL" ? <X className="size-3.5" strokeWidth={1.8} /> : null}
                                    {key === "SUB" ? <Minus className="size-3.5" strokeWidth={1.8} /> : null}
                                    {key === "ADD" ? <Plus className="size-3.5" strokeWidth={1.8} /> : null}
                                    {key === "EQ" ? <Equal className="size-3.5" strokeWidth={1.8} /> : null}
                                    {!["DEL", "DIV", "MUL", "SUB", "ADD", "EQ"].includes(key) ? label : null}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
