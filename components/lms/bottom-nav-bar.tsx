"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";

interface BottomNavBarProps {
    currentStep?: number;
    totalSteps?: number;
}

type SimulationButtonState = "new" | "continue" | "redo";

export function BottomNavBar({
    currentStep = 1,
    totalSteps = 5,
}: BottomNavBarProps) {
    const [buttonState, setButtonState] =
        useState<SimulationButtonState>("new");

    useEffect(() => {
        if (typeof window === "undefined") return;

        const completed =
            window.localStorage.getItem("itr-registration-completed") ===
            "true";
        const started =
            window.localStorage.getItem("itr-registration-started") ===
            "true";

        if (completed) {
            setButtonState("redo");
        } else if (started) {
            setButtonState("continue");
        } else {
            setButtonState("new");
        }
    }, []);

    const handleSimulationClick = () => {
        if (typeof window === "undefined") return;

        window.localStorage.setItem("itr-registration-started", "true");
        window.open("/simulation/gateway", "_blank", "noopener,noreferrer");
    };

    const simulationButtonLabel =
        buttonState === "redo"
            ? "Re-Do Task"
            : buttonState === "continue"
                ? "Continue"
                : "New Task";

    return (
        <div className="sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="flex h-16 items-center justify-between px-6">
                {/* Left: Progress indicator */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalSteps }, (_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i < currentStep
                                    ? "w-6 bg-primary"
                                    : i === currentStep
                                        ? "w-4 bg-primary/50"
                                        : "w-2 bg-muted-foreground/20"
                                    }`}
                            />
                        ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                        Step {currentStep} of {totalSteps}
                    </span>
                </div>

                {/* Right: Navigation buttons */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentStep <= 1}
                        className="gap-1"
                    >
                        <ChevronLeft className="size-4" />
                        Previous
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                    >
                        Next
                        <ChevronRight className="size-4" />
                    </Button>

                    <Button
                        size="sm"
                        className="gap-2 bg-primary font-semibold shadow-md hover:bg-primary/90 hover:shadow-lg transition-all"
                        onClick={handleSimulationClick}
                    >
                        <Play className="size-4" />
                        {simulationButtonLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
