"use client";

import { usePathname } from "next/navigation";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CourseTopicsSidebar } from "@/components/lms/course-topics-sidebar";
import { BottomNavBar } from "@/components/lms/bottom-nav-bar";
import { Separator } from "@/components/ui/separator";

export default function LmsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <SidebarProvider>
            <CourseTopicsSidebar />
            <SidebarInset>
                {/* Top header with sidebar trigger */}
                <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Prayog</span>
                        <span className="text-muted-foreground text-sm">/</span>
                        <span className="text-sm text-muted-foreground">LMS</span>
                    </div>
                </header>

                {/* Main content area */}
                <div className="flex flex-1 flex-col">
                    <main className="flex-1 overflow-y-auto">{children}</main>
                    {pathname.startsWith("/course") && <BottomNavBar />}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
