"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CourseTopicsSidebar } from "@/components/lms/course-topics-sidebar";
import { Bell, LogOut, LayoutDashboard, User, BookOpen, BarChart3, Award, Bookmark, ChevronRight, PanelLeftClose, PanelLeft } from "lucide-react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { PrayogLogo } from "@/components/branding/prayog-logo";
import { LmsBreadcrumbs } from "@/components/lms/lms-breadcrumbs";
import { LmsBreadcrumbProvider, useLmsBreadcrumbs } from "@/components/lms/lms-breadcrumb-context";
import { RightSidebar } from "@/components/lms/right-sidebar";

const NAV_ITEMS = [
    { label: "All Offerings", href: "/", icon: "✦" },
    { label: "Learning Contents", href: "/learning-contents", icon: BookOpen },
    { label: "My Progress", href: "/my-progress", icon: BarChart3 },
    { label: "Achievements", href: "/achievements", icon: Award },
    { label: "Saved", href: "/saved", icon: Bookmark },
];

function LmsLayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState("");
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
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
                if (user.email) {
                    const name = user.email.split("@")[0];
                    setUserName(name.charAt(0).toUpperCase() + name.slice(1));
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
    const hasCourseBreadcrumbs = isCoursePage && breadcrumbs.length > 0;
    const isLmsHomePage = pathname === "/";

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    return (
        <div className="flex min-h-screen w-full bg-background text-foreground">
            {isCoursePage && <CourseTopicsSidebar />}
            <SidebarInset className="flex flex-col">
                {/* Top header */}
                <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center justify-between border-b bg-background px-5">
                    <div className="flex items-center gap-2">
                        <Link href={"/"} className="flex items-center gap-2 group transition-all duration-200">
                            <PrayogLogo className="h-16 w-[264px] transition-transform duration-200 group-hover:scale-[1.02]" priority />
                        </Link>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 ml-auto">
                        {!loading && (role === "admin" || role === "super_admin") && (
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

                {hasCourseBreadcrumbs && (
                    <div className="sticky top-20 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                        <div className="container mx-auto px-6 py-3">
                            <LmsBreadcrumbs items={breadcrumbs} />
                        </div>
                    </div>
                )}

                {/* Progress Strip - Only on home page */}
                {isLmsHomePage && (
                    <div className="h-10 bg-muted/50 dark:bg-slate-900/50 border-b border-border dark:border-slate-800 flex items-center px-5 gap-3 text-sm">
                        {/* Left Group: Toggle + Streak */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                                className="p-1.5 text-muted-foreground dark:text-slate-400 hover:bg-muted dark:hover:bg-slate-800 rounded transition-colors"
                                aria-label={leftSidebarOpen ? "Close sidebar" : "Open sidebar"}
                            >
                                {leftSidebarOpen ? (
                                    <PanelLeftClose className="h-4 w-4" />
                                ) : (
                                    <PanelLeft className="h-4 w-4" />
                                )}
                            </button>
                            <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-semibold">
                                🔥 14 day streak
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-5 bg-border dark:bg-slate-700" />

                        {/* Center Group: Programs + Level/XP */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-muted-foreground dark:text-slate-400">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-600 dark:text-blue-400">
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                                    <path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5"/>
                                </svg>
                                <span>Programs Enrolled</span>
                                <strong className="text-foreground dark:text-slate-200">3</strong>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-full px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300">Lv 7</span>
                                <div className="w-24 h-1.5 bg-muted dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full w-[63%] bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" />
                                </div>
                                <span className="text-muted-foreground dark:text-slate-400 text-xs">1,260 / 2,000 XP</span>
                            </div>
                        </div>

                        <div className="flex-1" />

                        {/* Right Group: Greeting */}
                        <div className="text-muted-foreground dark:text-slate-400">
                            {getGreeting()}, <strong className="text-foreground dark:text-slate-200">{userName || "Learner"}</strong> 👋
                        </div>
                    </div>
                )}

                {/* Main content area with sidebars */}
                <div className="flex flex-1">
                    {/* Left Sidebar - Only on home page, starts below progress strip */}
                    {isLmsHomePage && (
                        <aside className={`${leftSidebarOpen ? 'w-52' : 'w-0'} flex-shrink-0 bg-muted/30 dark:bg-slate-900/30 border-r border-border dark:border-slate-800 transition-all duration-300 overflow-hidden`}>
                            {leftSidebarOpen && (
                                <div className="w-52 p-3 flex flex-col h-full">
                                    {/* Breadcrumb */}
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground dark:text-slate-500 mb-2 px-1.5">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                            <polyline points="9 22 9 12 15 12 15 22" />
                                        </svg>
                                        <span className="opacity-50">›</span>
                                        <span>Prayog Offerings</span>
                                    </div>

                                    {/* Navigation */}
                                    <nav className="flex flex-col gap-0.5 flex-1">
                                        {NAV_ITEMS.map((item) => {
                                            const isActive = item.href === pathname;
                                            const IconComponent = typeof item.icon === "string" ? null : item.icon;

                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={`flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                                                        isActive
                                                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold border-r-2 border-blue-600"
                                                            : "text-muted-foreground dark:text-slate-400 hover:bg-muted dark:hover:bg-slate-800"
                                                    }`}
                                                >
                                                    {typeof item.icon === "string" ? (
                                                        <span className="w-4 text-center text-base">{item.icon}</span>
                                                    ) : (
                                                        <item.icon className="w-4 h-4" />
                                                    )}
                                                    {item.label}
                                                </Link>
                                            );
                                        })}
                                    </nav>

                                    {/* Promo Card - Larger */}
                                    <div className="mt-auto p-3.5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border border-blue-200/50 dark:border-blue-800/50 rounded-xl">
                                        <div className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">Keep going!</div>
                                        <div className="text-[11px] text-muted-foreground dark:text-slate-400 mb-2">You&apos;re in the top 15% of learners this week.</div>
                                        <div className="text-3xl text-center mb-2.5">🏆</div>
                                        <Link
                                            href="/leaderboard"
                                            className="w-full flex items-center justify-between px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                                        >
                                            View Leaderboard
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </aside>
                    )}

                    {/* Center Content */}
                    <div className="flex-1 flex flex-col bg-muted/30 dark:bg-slate-950/30">
                        <main className="flex-1 overflow-y-auto w-full">
                            {children}
                        </main>
                    </div>

                    {/* Right Sidebar - Only on home page, always visible */}
                    {isLmsHomePage && <RightSidebar />}
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
