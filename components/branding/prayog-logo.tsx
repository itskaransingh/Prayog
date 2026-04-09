import Image from "next/image";

import { cn } from "@/lib/utils";

interface PrayogLogoProps {
    className?: string;
    priority?: boolean;
}

export function PrayogLogo({ className, priority = false }: PrayogLogoProps) {
    return (
        <div className={cn("relative h-16 w-[264px] shrink-0", className)}>
            <Image
                src="/prayog-logo.png"
                alt="Prayog"
                fill
                priority={priority}
                sizes="264px"
                className="object-contain object-left"
            />
        </div>
    );
}
