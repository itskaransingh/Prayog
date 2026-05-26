"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CourseTopicsSidebar } from "@/components/lms/course-topics-sidebar";
import { Bell, LogOut, LayoutDashboard, User } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { PrayogLogo } from "@/components/branding/prayog-logo";
import { LmsBreadcrumbs } from "@/components/lms/lms-breadcrumbs";
import { LmsBreadcrumbProvider, useLmsBreadcrumbs } from "@/components/lms/lms-breadcrumb-context";
import { RightSidebar } from "@/components/lms/right-sidebar";

function LmsLayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { breadcrumbs } = useLmsBreadcrumbs();

    useEffect(() => {
        const fetchUserRole = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();

                if (profile) {
                    setRole(profile.role);
                }
            }
            setLoading(false);
        };

        fetchUserRole();
    }, [supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    const isCoursePage = pathname.startsWith("/course");
    const isFinancialAccountingMapPage = pathname.startsWith("/learning-contents/financial-accounting");
    const hasCourseBreadcrumbs = isCoursePage && breadcrumbs.length > 0;
    const isLmsHomePage = pathname === "/";
    const useImmersiveMapShell = isFinancialAccountingMapPage;

    return (
        <div className="flex min-h-screen w-full bg-background text-foreground">
            {isCoursePage && !useImmersiveMapShell && <CourseTopicsSidebar />}
            <SidebarInset className="flex flex-col">
                {/* Top header */}
                <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b bg-background px-6">
                    <div className="flex items-center gap-2">
                        <Link href={"/"} className="flex items-center gap-2 group transition-all duration-200">
                            <PrayogLogo className="h-10 w-[200px] transition-transform duration-200 group-hover:scale-[1.02]" priority />
                        </Link>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 ml-auto">
                        {!loading && (role === "admin" || role === "super_admin" || role === "faculty") && (
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-blue-600 hover:bg-accent/50">
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span>Dashboard</span>
                                </Button>
                                <Button variant="ghost" size="icon" className="sm:hidden text-muted-foreground">
                                    <LayoutDashboard className="h-4 w-4" />
                                </Button>
                            </Link>
                        )}

                        <ThemeToggle />

                        <button className="relative p-2 text-muted-foreground hover:bg-accent rounded-full transition-colors flex items-center justify-center">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-background"></span>
                        </button>

                        <Separator orientation="vertical" className="h-6" />

                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 flex items-center justify-center border border-blue-200 dark:border-blue-800 shadow-sm">
                                <User className="h-4 w-4" />
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 gap-2 font-medium"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        </div>
                    </div>
                </header>

                {hasCourseBreadcrumbs && !useImmersiveMapShell && (
                    <div className="sticky top-20 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                        <div className="container mx-auto px-6 py-3">
                            <LmsBreadcrumbs items={breadcrumbs} />
                        </div>
                    </div>
                )}
                {/* Main content area */}
                <div className={`flex flex-1 ${useImmersiveMapShell ? "bg-background" : ""}`}>
                    {/* Center Content */}
                    <div className={`flex-1 flex flex-col ${useImmersiveMapShell ? "bg-background" : "bg-muted/30 dark:bg-slate-950/30"}`}>
                        <main className={`flex-1 overflow-y-auto w-full ${useImmersiveMapShell ? "bg-background" : ""}`}>
                            {children}
                        </main>
                    </div>

                    {/* Right Sidebar - Only on home page, always visible */}
                    {isLmsHomePage && !useImmersiveMapShell && <RightSidebar />}
                </div>
            </SidebarInset>
        </div>
    );
}

export default function LmsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SidebarProvider>
            <LmsBreadcrumbProvider>
                <LmsLayoutShell>{children}</LmsLayoutShell>
            </LmsBreadcrumbProvider>
        </SidebarProvider>
    );
}
