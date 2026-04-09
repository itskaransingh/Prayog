import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface LmsBreadcrumbsProps {
    items: BreadcrumbItem[];
}

export function LmsBreadcrumbs({ items }: LmsBreadcrumbsProps) {
    if (items.length === 0) return null;

    return (
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            <Link href="/" aria-label="Home" className="rounded-sm transition-colors hover:text-foreground">
                <Home className="size-4" />
            </Link>
            {items.map((item, index) => {
                const isLast = index === items.length - 1;

                return (
                    <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                        <ChevronRight className="size-4" />
                        {item.href && !isLast ? (
                            <Link href={item.href} className="transition-colors hover:text-foreground">
                                {item.label}
                            </Link>
                        ) : (
                            <span className={isLast ? "font-medium text-foreground" : ""}>{item.label}</span>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}
