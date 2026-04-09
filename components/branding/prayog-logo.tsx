import Image from "next/image";

import { cn } from "@/lib/utils";

interface PrayogLogoProps {
    className?: string;
    priority?: boolean;
}

export function PrayogLogo({ className, priority = false }: PrayogLogoProps) {
    return (
        <div className={cn("relative h-14 w-[228px] shrink-0", className)}>
            <Image
                src="/prayog-logo.png"
                alt="Prayog"
                fill
                priority={priority}
                sizes="228px"
                className="object-contain object-left"
            />
        </div>
    );
}
