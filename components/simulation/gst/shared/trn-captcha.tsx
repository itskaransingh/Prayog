"use client";

import { useMemo } from "react";

interface TrnCaptchaProps {
    code: string;
    className?: string;
}

function createNoise(seed: string) {
    return Array.from({ length: 5 }, (_, index) => {
        const code = seed.charCodeAt(index % Math.max(seed.length, 1)) || 65;
        const x1 = 8 + index * 22;
        const y1 = 12 + (code % 11);
        const x2 = 22 + index * 22;
        const y2 = 34 - (code % 9);

        return { x1, y1, x2, y2 };
    });
}

export function TrnCaptcha({ code, className }: TrnCaptchaProps) {
    const noise = useMemo(() => createNoise(code), [code]);

    return (
        <div className={className}>
            <svg
                className="gst-trn-captcha-svg"
                viewBox="0 0 132 38"
                role="img"
                aria-label={`Captcha ${code}`}
            >
                <rect x="0" y="0" width="132" height="38" fill="#ffffff" />
                {Array.from({ length: 13 }).map((_, index) => (
                    <line
                        key={`v-${index}`}
                        x1={index * 11}
                        y1="0"
                        x2={index * 11}
                        y2="38"
                        stroke="#000000"
                        strokeWidth="0.5"
                        opacity="0.7"
                    />
                ))}
                {Array.from({ length: 7 }).map((_, index) => (
                    <line
                        key={`h-${index}`}
                        x1="0"
                        y1={index * 6}
                        x2="132"
                        y2={index * 6}
                        stroke="#000000"
                        strokeWidth="0.5"
                        opacity="0.7"
                    />
                ))}
                {noise.map((line, index) => (
                    <line
                        key={`n-${index}`}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke={index % 2 === 0 ? "#d10909" : "#2f2f2f"}
                        strokeWidth={index === 2 ? "2.2" : "1.4"}
                    />
                ))}
                <text
                    x="8"
                    y="26"
                    fill="#111111"
                    fontFamily="Georgia, 'Times New Roman', serif"
                    fontSize="20"
                    fontStyle="italic"
                    fontWeight="700"
                    letterSpacing="1.8"
                    transform="skewX(-10)"
                >
                    {code}
                </text>
            </svg>
        </div>
    );
}
