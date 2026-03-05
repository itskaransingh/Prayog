"use client";

import * as React from "react";
import { BookOpen, ChevronRight, GraduationCap } from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

// Sample course data for the Income Tax module
const courseTopics = [
    {
        title: "ITREG_005AE",
        href: "/course/income-tax",
        isActive: true,
    },
    {
        title: "ITREG_005AF",
        href: "#",
        isActive: false,
    },
    {
        title: "ITREG_005AG",
        href: "#",
        isActive: false,
    },
    {
        title: "ITREG_005AH",
        href: "#",
        isActive: false,
    },
    {
        title: "ITREG_005AI",
        href: "#",
        isActive: false,
    },
    {
        title: "ITREG_005AJ",
        href: "#",
        isActive: false,
    },
    {
        title: "ITREG_005AK",
        href: "#",
        isActive: false,
    },
    {
        title: "ITREG_005AL",
        href: "#",
        isActive: false,
    },
    {
        title: "ITREG_005AM",
        href: "#",
        isActive: false,
    },
    {
        title: "ITREG_005AN",
        href: "#",
        isActive: false,
    },
];

export function CourseTopicsSidebar({
    ...props
}: React.ComponentProps<typeof Sidebar>) {
    const [isItrCompleted, setIsItrCompleted] = React.useState(false);

    React.useEffect(() => {
        const completed = localStorage.getItem("itr-registration-completed");
        if (completed === "true") {
            setIsItrCompleted(true);
        }
    }, []);

    return (
        <Sidebar collapsible="icon" className="border-r" {...props}>
            {/* Sidebar Header */}
            <SidebarHeader className="border-b border-sidebar-border">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="pointer-events-none"
                        >
                            <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                <GraduationCap className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">Prayog LMS</span>
                                <span className="truncate text-xs text-muted-foreground">
                                    Course Dashboard
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* Sidebar Content — scrollable topic list */}
            <SidebarContent>
                <ScrollArea className="h-full">
                    <SidebarGroup>
                        <SidebarGroupLabel>Question IDs</SidebarGroupLabel>
                        <SidebarMenu>
                            {courseTopics.map((topic) => (
                                <SidebarMenuItem key={topic.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={topic.isActive}
                                    >
                                        <a href={topic.href}>
                                            <span>
                                                {topic.title}
                                                {topic.isActive && isItrCompleted && (
                                                    <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                                        Completed
                                                    </span>
                                                )}
                                            </span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                </ScrollArea>
            </SidebarContent>

            <SidebarRail />
        </Sidebar>
    );
}
