"use client";

import { useRef } from "react";

interface EPANOtpInputProps {
    value: string[];
    onChange: (digits: string[]) => void;
    length?: number;
    disabled?: boolean;
    className?: string;
}

export function EPANOtpInput({
    value,
    onChange,
    length = 6,
    disabled = false,
    className = "",
}: EPANOtpInputProps) {
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const focusIndex = (index: number) => {
        const nextInput = inputRefs.current[index];
        if (nextInput) {
            nextInput.focus();
            nextInput.select();
        }
    };

    const updateDigit = (index: number, digit: string) => {
        const nextDigits = Array.from({ length }, (_, itemIndex) => value[itemIndex] ?? "");
        nextDigits[index] = digit;
        onChange(nextDigits);
    };

    const handleInputChange = (index: number, rawValue: string) => {
        const digitsOnly = rawValue.replace(/\D/g, "");

        if (digitsOnly.length > 1) {
            const nextDigits = Array.from({ length }, (_, itemIndex) => value[itemIndex] ?? "");
            digitsOnly.slice(0, length - index).split("").forEach((digit, digitIndex) => {
                nextDigits[index + digitIndex] = digit;
            });
            onChange(nextDigits);
            focusIndex(Math.min(index + digitsOnly.length, length - 1));
            return;
        }

        updateDigit(index, digitsOnly);

        if (digitsOnly && index < length - 1) {
            focusIndex(index + 1);
        }
    };

    const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Backspace" && !value[index] && index > 0) {
            focusIndex(index - 1);
        }

        if (event.key === "ArrowLeft" && index > 0) {
            event.preventDefault();
            focusIndex(index - 1);
        }

        if (event.key === "ArrowRight" && index < length - 1) {
            event.preventDefault();
            focusIndex(index + 1);
        }
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();
        const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
        if (!pasted) return;

        const nextDigits = Array.from({ length }, (_, itemIndex) => value[itemIndex] ?? "");
        pasted.split("").forEach((digit, index) => {
            nextDigits[index] = digit;
        });
        onChange(nextDigits);
        focusIndex(Math.min(pasted.length - 1, length - 1));
    };

    return (
        <div className={`epan-otp-group ${className}`.trim()}>
            {Array.from({ length }, (_, index) => (
                <input
                    key={index}
                    ref={(element) => {
                        inputRefs.current[index] = element;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    className="epan-otp-box"
                    maxLength={1}
                    value={value[index] ?? ""}
                    disabled={disabled}
                    onChange={(event) => handleInputChange(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    onPaste={handlePaste}
                    aria-label={`OTP digit ${index + 1}`}
                />
            ))}
        </div>
    );
}
