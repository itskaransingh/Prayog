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

export default function LmsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = useMemo(() => createClient(), []);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

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

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background text-foreground">
                {isCoursePage && <CourseTopicsSidebar />}
                <SidebarInset className="flex flex-col">
                    {/* Top header */}
                    <header className="flex container mx-auto h-20 shrink-0 items-center justify-between border-b px-4 bg-background sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <Link href={"/"} className="flex items-center gap-2 group transition-all duration-200">
                                <PrayogLogo className="h-16 w-[264px] transition-transform duration-200 group-hover:scale-[1.02]" priority />
                            </Link>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                            {!loading && role === "admin" && (
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

                    {/* Main content area */}
                    <div className="flex flex-1 flex-col bg-muted/30">
                        <main className="flex-1 overflow-y-auto w-full">
                            {children}
                        </main>
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
