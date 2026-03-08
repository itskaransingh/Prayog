"use client";

import { usePathname } from "next/navigation";
import { BottomNavBar } from "@/components/lms/bottom-nav-bar";
import { CourseTopicsSidebar } from "@/components/lms/course-topics-sidebar";
import { Bell, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Link from "next/link";

export default function LmsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isCoursePage = pathname.startsWith("/course");

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full">
                {isCoursePage && <CourseTopicsSidebar />}
                <SidebarInset className="flex 
                 flex-col">
                    {/* Top header */}
                    <header className="flex container mx-auto h-14 shrink-0 items-center justify-between border-b px-4 bg-white">
                        <div className="flex items-center gap-2">
                            <Link href={"/"} className="flex items-center gap-2">
                                <div className="h-6 w-6 bg-blue-600 rounded flex items-center justify-center text-white text-[12px] font-bold shadow-sm">
                                    P
                                </div>
                                <span className="text-sm font-semibold tracking-tight text-gray-900">Prayog</span>
                            </Link>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
                            </button>
                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200 shadow-sm cursor-pointer hover:bg-blue-200 transition-colors">
                                <User className="h-4 w-4" />
                            </div>
                        </div>
                    </header>

                    {/* Main content area */}
                    <div className="flex flex-1 flex-col bg-[#f3f4f6]">
                        <main className="flex-1 overflow-y-auto">{children}</main>
                        {/* {pathname.startsWith("/course") && <BottomNavBar />} */}
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
