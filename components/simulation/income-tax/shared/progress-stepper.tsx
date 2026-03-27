"use client";

export interface ProgressStepItem {
    number: number;
    label: string;
}

interface ProgressStepperProps {
    steps: readonly ProgressStepItem[];
    currentStep: number;
    completedSteps?: number[];
    className?: string;
    stepClassName?: string;
    activeClassName?: string;
    completedClassName?: string;
    rowClassName?: string;
    numberClassName?: string;
    labelClassName?: string;
    connectorClassName?: string;
}

export function ProgressStepper({
    steps,
    currentStep,
    completedSteps,
    className = "sim-stepper",
    stepClassName = "sim-step",
    activeClassName = "active",
    completedClassName = "completed",
    rowClassName = "sim-step-row",
    numberClassName = "sim-step-number",
    labelClassName = "sim-step-label",
    connectorClassName = "sim-step-connector",
}: ProgressStepperProps) {
    return (
        <div className={className}>
            {steps.map((step, idx) => {
                const isCompleted = completedSteps
                    ? completedSteps.includes(step.number)
                    : step.number < currentStep;
                const isActive = step.number === currentStep && !isCompleted;
                const isLast = idx === steps.length - 1;

                let itemClassName = stepClassName;
                if (isActive) itemClassName += ` ${activeClassName}`;
                if (isCompleted) itemClassName += ` ${completedClassName}`;

                return (
                    <div key={step.number} className={itemClassName}>
                        <div className={rowClassName}>
                            <div className={numberClassName}>
                                {isCompleted ? "✓" : step.number}
                            </div>
                            {!isLast && <div className={connectorClassName} />}
                        </div>
                        <div className={labelClassName}>{step.label}</div>
                    </div>
                );
            })}
        </div>
    );
}
