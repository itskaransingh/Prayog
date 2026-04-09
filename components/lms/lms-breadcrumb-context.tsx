"use client";

import * as React from "react";

type BreadcrumbItem = {
    label: string;
    href?: string;
};

interface LmsBreadcrumbContextValue {
    breadcrumbs: BreadcrumbItem[];
    setBreadcrumbs: (items: BreadcrumbItem[]) => void;
}

const LmsBreadcrumbContext = React.createContext<LmsBreadcrumbContextValue | null>(null);

export function LmsBreadcrumbProvider({ children }: { children: React.ReactNode }) {
    const [breadcrumbs, setBreadcrumbs] = React.useState<BreadcrumbItem[]>([]);

    const value = React.useMemo(
        () => ({
            breadcrumbs,
            setBreadcrumbs,
        }),
        [breadcrumbs],
    );

    return (
        <LmsBreadcrumbContext.Provider value={value}>
            {children}
        </LmsBreadcrumbContext.Provider>
    );
}

export function useLmsBreadcrumbs() {
    const context = React.useContext(LmsBreadcrumbContext);

    if (!context) {
        throw new Error("useLmsBreadcrumbs must be used within an LmsBreadcrumbProvider");
    }

    return context;
}
