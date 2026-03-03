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
        title: "Registration",
        icon: BookOpen,
        isActive: true,
        subtopics: [
            { title: "PAN Application", href: "#", isActive: false },
            { title: "TAN Registration", href: "#", isActive: false },
            { title: "ITR Registration", href: "#", isActive: true },
            { title: "Digital Signature", href: "#", isActive: false },
        ],
    },
    {
        title: "Returns Filing",
        icon: BookOpen,
        isActive: false,
        subtopics: [
            { title: "ITR-1 (Sahaj)", href: "#", isActive: false },
            { title: "ITR-2", href: "#", isActive: false },
            { title: "ITR-3", href: "#", isActive: false },
            { title: "ITR-4 (Sugam)", href: "#", isActive: false },
        ],
    },
    {
        title: "Tax Assessment",
        icon: BookOpen,
        isActive: false,
        subtopics: [
            { title: "Self Assessment", href: "#", isActive: false },
            { title: "Scrutiny Assessment", href: "#", isActive: false },
            { title: "Best Judgement", href: "#", isActive: false },
        ],
    },
    {
        title: "TDS & TCS",
        icon: BookOpen,
        isActive: false,
        subtopics: [
            { title: "TDS Returns (26Q)", href: "#", isActive: false },
            { title: "TDS Certificates", href: "#", isActive: false },
            { title: "TCS Compliance", href: "#", isActive: false },
        ],
    },
    {
        title: "Refunds & Grievances",
        icon: BookOpen,
        isActive: false,
        subtopics: [
            { title: "Refund Status", href: "#", isActive: false },
            { title: "Rectification Request", href: "#", isActive: false },
            { title: "Grievance Filing", href: "#", isActive: false },
        ],
    },
];

export function CourseTopicsSidebar({
    ...props
}: React.ComponentProps<typeof Sidebar>) {
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
                                <span className="truncate font-semibold">Income Tax</span>
                                <span className="truncate text-xs text-muted-foreground">
                                    Practical Training
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
                        <SidebarGroupLabel>Course Topics</SidebarGroupLabel>
                        <SidebarMenu>
                            {courseTopics.map((topic) => (
                                <Collapsible
                                    key={topic.title}
                                    asChild
                                    defaultOpen={topic.isActive}
                                    className="group/collapsible"
                                >
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton tooltip={topic.title}>
                                                {topic.icon && <topic.icon className="size-4" />}
                                                <span>{topic.title}</span>
                                                <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {topic.subtopics.map((sub) => (
                                                    <SidebarMenuSubItem key={sub.title}>
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            isActive={sub.isActive}
                                                        >
                                                            <a href={sub.href}>
                                                                <span>{sub.title}</span>
                                                            </a>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                </ScrollArea>
            </SidebarContent>

            <SidebarRail />
        </Sidebar>
    );
}
