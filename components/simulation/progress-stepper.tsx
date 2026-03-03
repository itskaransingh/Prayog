"use client";

import { useRegistration } from "@/lib/simulation/registration-context";
import { REGISTRATION_STEPS } from "@/lib/simulation/constants";

export function ProgressStepper() {
    const { currentStep } = useRegistration();

    return (
        <div className="sim-stepper">
            {REGISTRATION_STEPS.map((step, idx) => {
                const isActive = step.number === currentStep;
                const isCompleted = step.number < currentStep;
                const isLast = idx === REGISTRATION_STEPS.length - 1;

                let className = "sim-step";
                if (isActive) className += " active";
                if (isCompleted) className += " completed";

                return (
                    <div key={step.number} className={className}>
                        <div className="sim-step-row">
                            <div className="sim-step-number">
                                {isCompleted ? "✓" : step.number}
                            </div>
                            {!isLast && <div className="sim-step-connector" />}
                        </div>
                        <div className="sim-step-label">{step.label}</div>
                    </div>
                );
            })}
        </div>
    );
}
