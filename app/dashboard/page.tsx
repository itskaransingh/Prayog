"use client";

import { useState, useEffect, useCallback } from "react";
import {
    LayoutDashboard,
    Users,
    Settings,
    ShieldCheck,
    ArrowLeft,
    BookOpen,
    FileText,
    History
} from "lucide-react";
import { CreateUserForm } from "@/components/admin/create-user-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Tab = "overview" | "users" | "simulations" | "settings";

interface CourseOption {
    id: string;
    title: string;
    slug: string;
}

interface ChapterOption {
    id: string;
    course_id: string;
    title: string;
    slug: string;
}

interface SimulationAttempt {
    attempt_id: string;
    question_attempt_id: string;
    user_id: string;
    full_name: string;
    email: string;
    course_id: string;
    course_name: string;
    chapter_id: string;
    chapter_name: string;
    question_id: string;
    question_title: string;
    task_id: string;
    task_title: string;
    total_score: number;
    max_possible_score: number;
    accuracy: number;
    is_correct: boolean;
    created_at: string;
    question_attempt_created_at: string;
    attempt_number: number;
}

interface GroupedQuestion {
    question_id: string;
    question_title: string;
    attempt_count: number;
    attempts: SimulationAttempt[];
}

interface GroupedUser {
    user_id: string;
    full_name: string;
    email: string;
    questions: GroupedQuestion[];
}

interface GroupedChapter {
    course_id: string;
    course_name: string;
    chapter_id: string;
    chapter_name: string;
    users: GroupedUser[];
}

function getChapterAttemptCount(group: GroupedChapter) {
    return group.users.reduce(
        (userTotal, user) =>
            userTotal +
            user.questions.reduce(
                (questionTotal, question) => questionTotal + question.attempt_count,
                0,
            ),
        0,
    );
}

interface AdminUserRecord {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    created_at: string;
}

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>("users");
    const [userRole, setUserRole] = useState<string>("");
    const [users, setUsers] = useState<AdminUserRecord[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [chapters, setChapters] = useState<ChapterOption[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [selectedChapterId, setSelectedChapterId] = useState("");
    const [simulations, setSimulations] = useState<SimulationAttempt[]>([]);
    const [groupedSimulations, setGroupedSimulations] = useState<GroupedChapter[]>([]);
    const [isLoadingCourses, setIsLoadingCourses] = useState(false);
    const [isLoadingChapters, setIsLoadingChapters] = useState(false);
    const [isLoadingSimulations, setIsLoadingSimulations] = useState(false);
    const [errorSimulations, setErrorSimulations] = useState<string | null>(null);
    const [isEmptySimulations, setIsEmptySimulations] = useState(false);

    const fetchUsers = useCallback(async () => {
        setIsLoadingUsers(true);
        try {
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            if (res.ok && data.users) {
                setUsers(data.users);
            } else {
                console.error("Failed to fetch users:", data.error);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsLoadingUsers(false);
        }
    }, []);

    const fetchUserRole = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/me");
            if (res.ok) {
                const data = await res.json();
                if (data.role) {
                    setUserRole(data.role);
                }
            }
        } catch (error) {
            console.error("Error fetching user role:", error);
        }
    }, []);

    const fetchCourses = useCallback(async () => {
        setIsLoadingCourses(true);
        try {
            const res = await fetch("/api/admin/courses");
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch courses");
            }

            setCourses(data.courses || []);
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setIsLoadingCourses(false);
        }
    }, []);

    const fetchChapters = useCallback(async (courseId: string) => {
        setIsLoadingChapters(true);
        try {
            const res = await fetch(`/api/admin/chapters?courseId=${courseId}`);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch chapters");
            }

            setChapters(data.chapters || []);
        } catch (error) {
            console.error("Error fetching chapters:", error);
            setChapters([]);
        } finally {
            setIsLoadingChapters(false);
        }
    }, []);

    const fetchSimulations = useCallback(async () => {
        setIsLoadingSimulations(true);
        setErrorSimulations(null);
        try {
            const searchParams = new URLSearchParams();
            if (selectedCourseId) {
                searchParams.set("courseId", selectedCourseId);
            }
            if (selectedChapterId) {
                searchParams.set("chapterId", selectedChapterId);
            }

            const queryString = searchParams.toString();
            const res = await fetch(
                `/api/admin/simulation-attempts${queryString ? `?${queryString}` : ""}`,
            );
            const data = await res.json();
            if (res.ok && data.attempts) {
                setSimulations(data.attempts);
                setGroupedSimulations(data.groupedByChapter || []);
                setIsEmptySimulations(Boolean(data._isEmpty));
            } else {
                console.error("Failed to fetch simulations:", data.error);
                setErrorSimulations(data.error || "Unknown error occurred");
                setIsEmptySimulations(false);
            }
        } catch (error: unknown) {
            console.error("Error fetching simulations:", error);
            setErrorSimulations(
                error instanceof Error ? error.message : String(error),
            );
            setIsEmptySimulations(false);
        } finally {
            setIsLoadingSimulations(false);
        }
    }, [selectedCourseId, selectedChapterId]);

    useEffect(() => {
        fetchUserRole();
        if (activeTab === "users") {
            fetchUsers();
        } else if (activeTab === "simulations") {
            fetchCourses();
            fetchSimulations();
        }
    }, [activeTab, fetchUsers, fetchCourses, fetchSimulations, fetchUserRole]);

    useEffect(() => {
        if (activeTab !== "simulations") {
            return;
        }

        if (!selectedCourseId) {
            setChapters([]);
            setSelectedChapterId("");
            return;
        }

        void fetchChapters(selectedCourseId);
    }, [activeTab, fetchChapters, selectedCourseId]);

    const isFaculty = userRole === "faculty";
    const isAdminOrSuperAdmin = userRole === "admin" || userRole === "super_admin";

    const tabs = [
        { id: "overview", label: "Overview", icon: LayoutDashboard, roles: ["super_admin", "admin"] as const },
        { id: "users", label: "Users", icon: Users, roles: ["super_admin", "admin", "faculty"] as const },
        { id: "simulations", label: "Simulation Attempts", icon: History, roles: ["super_admin", "admin"] as const },
        { id: "settings", label: "Settings", icon: Settings, roles: ["super_admin", "admin"] as const },
    ].filter((tab) => tab.roles.includes(userRole as (typeof tab.roles)[number]));

    const visibleTabs = tabs.map((tab) => ({ id: tab.id, label: tab.label, icon: tab.icon }));

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
                <div className="p-6">
                    <Link href="/" className="flex items-center gap-2 group">
                        <ArrowLeft className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        <span className="text-sm font-medium text-slate-500 group-hover:text-blue-600 transition-colors">Back to App</span>
                    </Link>
                    <div className="mt-8 flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Admin</h1>
                            <p className="text-xs font-medium text-slate-500">Dashboard</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {visibleTabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as Tab)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                    ? "bg-blue-50 text-blue-600 shadow-sm"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                            >
                                <Icon className={`h-4 w-4 ${activeTab === tab.id ? "text-blue-600" : "text-slate-400"}`} />
                                {tab.label}
                            </button>
                        );
                    })}

                    <div className="pt-6 pb-2 px-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Content Management</p>
                    </div>
                    {isAdminOrSuperAdmin && (
                        <Link
                            href="/dashboard/admin/content/courses"
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        >
                            <BookOpen className="h-4 w-4 text-slate-400" />
                            Courses & Chapters
                        </Link>
                    )}
                    <Link
                        href="/dashboard/admin/content/questions"
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    >
                        <FileText className="h-4 w-4 text-slate-400" />
                        Tasks
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">System Status</p>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs font-medium text-slate-600">All systems operational</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
                    <h2 className="text-xl font-semibold text-slate-800 capitalize">
                        {activeTab}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-semibold text-slate-900">
                                {userRole === "super_admin" ? "Super Admin" : userRole === "admin" ? "Admin" : userRole === "faculty" ? "Faculty" : "Administrator"}
                            </p>
                            <p className="text-[10px] text-slate-500">
                                {userRole === "super_admin" ? "Full Access" : userRole === "admin" ? "Admin Access" : userRole === "faculty" ? "Faculty Access" : "Super Admin Access"}
                            </p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600" />
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto w-full">
                    {activeTab === "overview" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { label: "Total Users", value: "24", change: "+12%", icon: Users, color: "blue" },
                                    { label: "Active Sessions", value: "8", change: "+3%", icon: ShieldCheck, color: "green" },
                                    { label: "System Load", value: "12%", change: "-2%", icon: LayoutDashboard, color: "amber" },
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`p-2 rounded-lg bg-${stat.color}-50`}>
                                                <stat.icon className={`h-5 w-5 text-${stat.color}-600`} />
                                            </div>
                                            <span className={`text-xs font-bold ${stat.change.startsWith("+") ? "text-green-600" : "text-amber-600"} bg-${stat.change.startsWith("+") ? "green" : "amber"}-50 px-2 py-0.5 rounded-full`}>
                                                {stat.change}
                                            </span >
                                        </div>
                                        <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                                        <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
                                <div className="p-4 bg-slate-50 rounded-full mb-4">
                                    <LayoutDashboard className="h-8 w-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">Dashboard Overview Coming Soon</h3>
                                <p className="text-sm text-slate-500 max-w-xs mt-2">We&apos;re currently building out the detailed analytics and reporting modules for the admin panel.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === "users" && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {!isFaculty && (
                                <div className="lg:col-span-1">
                                    <CreateUserForm onSuccess={fetchUsers} userRole={userRole} />
                                </div>
                            )}
                            <div className={isFaculty ? "lg:col-span-3" : "lg:col-span-2"}>
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                        <h3 className="font-semibold text-slate-900">Recently Created Users</h3>
                                        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoadingUsers}>
                                            Refresh
                                        </Button>
                                    </div>
                                    {isLoadingUsers ? (
                                        <div className="p-12 text-center text-slate-500">
                                            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                                            Loading users...
                                        </div>
                                    ) : users.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <Users className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                                            <p className="text-sm text-slate-500 font-medium">No users found</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-6 py-3 font-medium">Full Name</th>
                                                        <th className="px-6 py-3 font-medium">Email</th>
                                                        <th className="px-6 py-3 font-medium">Role</th>
                                                        <th className="px-6 py-3 font-medium">Created At</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {users.map((user) => (
                                                        <tr key={user.id} className="hover:bg-slate-50/50">
                                                            <td className="px-6 py-3 font-medium text-slate-900">
                                                                {user.full_name?.trim() || user.email.split("@")[0]}
                                                            </td>
                                                            <td className="px-6 py-3 font-medium text-slate-900">{user.email}</td>
                                                            <td className="px-6 py-3">
                                                                <span className={`px-2.5 py-1 inline-flex text-[10px] leading-4 font-semibold rounded-full ${
                                                                    user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                                                                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                                    user.role === 'faculty' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-green-100 text-green-800'
                                                                }`}>
                                                                    {user.role === 'super_admin' ? 'Super Admin' :
                                                                     user.role === 'admin' ? 'Admin' :
                                                                     user.role === 'faculty' ? 'Faculty' :
                                                                     'Student'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-3 text-slate-500">
                                                                {new Date(user.created_at).toLocaleDateString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "simulations" && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex flex-col gap-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <h3 className="font-semibold text-slate-900">User Simulation Attempts</h3>
                                            <p className="text-sm text-slate-500 mt-1">
                                                Filter by course and chapter, then review each learner&apos;s question-wise attempt history in chronological order.
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={fetchSimulations} disabled={isLoadingSimulations}>
                                            Refresh
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="space-y-2 text-sm">
                                            <span className="font-medium text-slate-700">Course</span>
                                            <select
                                                className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                value={selectedCourseId}
                                                onChange={(event) => {
                                                    setSelectedCourseId(event.target.value);
                                                    setSelectedChapterId("");
                                                }}
                                                disabled={isLoadingCourses}
                                            >
                                                <option value="">
                                                    {isLoadingCourses ? "Loading courses..." : "All courses"}
                                                </option>
                                                {courses.map((course) => (
                                                    <option key={course.id} value={course.id}>
                                                        {course.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        <label className="space-y-2 text-sm">
                                            <span className="font-medium text-slate-700">Chapter</span>
                                            <select
                                                className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                value={selectedChapterId}
                                                onChange={(event) => setSelectedChapterId(event.target.value)}
                                                disabled={!selectedCourseId || isLoadingChapters}
                                            >
                                                <option value="">
                                                    {!selectedCourseId
                                                        ? "Select a course first"
                                                        : isLoadingChapters
                                                        ? "Loading chapters..."
                                                        : "All chapters"}
                                                </option>
                                                {chapters.map((chapter) => (
                                                    <option key={chapter.id} value={chapter.id}>
                                                        {chapter.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>
                                </div>
                                {isLoadingSimulations ? (
                                    <div className="p-12 text-center text-slate-500">
                                        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                                        Loading attempts...
                                    </div>
                                ) : errorSimulations ? (
                                    <div className="p-12 text-center">
                                        <div className="h-10 w-10 text-red-500 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">!</div>
                                        <p className="text-sm text-red-600 font-medium">Failed to load attempts</p>
                                        <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">{errorSimulations}</p>
                                    </div>
                                ) : isEmptySimulations ? (
                                    <div className="p-12 text-center">
                                        <History className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                                        <p className="text-sm text-slate-500 font-medium">No simulation attempts yet</p>
                                        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
                                            Learners haven&apos;t submitted any simulations yet, so this table is still empty.
                                        </p>
                                    </div>
                                ) : simulations.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <History className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                                        <p className="text-sm text-slate-500 font-medium">No attempts match the selected filters</p>
                                        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
                                            Try a different module or submodule filter to surface matching attempts.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-6 space-y-6 bg-slate-50/60">
                                        {groupedSimulations.map((chapterGroup) => (
                                            <section
                                                key={chapterGroup.chapter_id}
                                                className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                                            >
                                                <div className="border-b border-slate-100 px-6 py-5 bg-slate-50/80">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                                            {chapterGroup.course_name}
                                                        </span>
                                                        <h4 className="text-lg font-semibold text-slate-900">
                                                            {chapterGroup.chapter_name}
                                                        </h4>
                                                        <span className="text-sm text-slate-500">
                                                            {chapterGroup.users.length} user{chapterGroup.users.length === 1 ? "" : "s"}
                                                        </span>
                                                        <span className="text-sm text-slate-500">
                                                            {getChapterAttemptCount(chapterGroup)} total attempt{getChapterAttemptCount(chapterGroup) === 1 ? "" : "s"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="divide-y divide-slate-100">
                                                    {chapterGroup.users.map((groupedUser) => (
                                                        <div key={groupedUser.user_id} className="px-6 py-5 space-y-4">
                                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                                <div>
                                                                    <p className="text-base font-semibold text-slate-900">
                                                                        {groupedUser.full_name}
                                                                    </p>
                                                                    <p className="text-sm text-slate-500">
                                                                        {groupedUser.email}
                                                                    </p>
                                                                    <p className="text-sm text-slate-500">
                                                                        {groupedUser.questions.length} question{groupedUser.questions.length === 1 ? "" : "s"} attempted in this submodule
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                                {groupedUser.questions.map((question) => (
                                                                    <div
                                                                        key={question.question_id}
                                                                        className="rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden"
                                                                    >
                                                                        <div className="px-4 py-3 border-b border-slate-200 bg-white">
                                                                            <div className="flex items-center justify-between gap-3">
                                                                                <p className="font-semibold text-slate-900">
                                                                                    {question.question_title}
                                                                                </p>
                                                                                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                                                                    {question.attempt_count} attempt{question.attempt_count === 1 ? "" : "s"}
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        <div className="overflow-x-auto">
                                                                            <table className="w-full text-sm text-left">
                                                                                <thead className="bg-slate-100/80 text-slate-500">
                                                                                    <tr>
                                                                                        <th className="px-4 py-2.5 font-medium">Attempt</th>
                                                                                        <th className="px-4 py-2.5 font-medium">Score</th>
                                                                                        <th className="px-4 py-2.5 font-medium">Accuracy</th>
                                                                                        <th className="px-4 py-2.5 font-medium">Submitted At</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-slate-200">
                                                                                    {question.attempts.map((attempt) => (
                                                                                        <tr key={attempt.question_attempt_id} className="bg-white">
                                                                                            <td className="px-4 py-3">
                                                                                                <span className="inline-flex items-center rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">
                                                                                                    #{attempt.attempt_number}
                                                                                                </span>
                                                                                            </td>
                                                                                            <td className="px-4 py-3 font-semibold text-blue-600">
                                                                                                {attempt.total_score}/{attempt.max_possible_score}
                                                                                            </td>
                                                                                            <td className="px-4 py-3">
                                                                                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                                                                                    attempt.accuracy >= 80 ? "bg-green-100 text-green-700" :
                                                                                                    attempt.accuracy >= 50 ? "bg-amber-100 text-amber-700" :
                                                                                                    "bg-red-100 text-red-700"
                                                                                                }`}>
                                                                                                    {Math.round(attempt.accuracy)}%
                                                                                                </span>
                                                                                            </td>
                                                                                            <td className="px-4 py-3 text-slate-500 text-xs">
                                                                                                {new Date(attempt.created_at).toLocaleString()}
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        ))}

                                        <div className="rounded-xl border border-slate-200 bg-white px-6 py-4">
                                            <p className="text-sm font-medium text-slate-700">
                                                {simulations.length} total attempt record{simulations.length === 1 ? "" : "s"} in the current view
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "settings" && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                            <Settings className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-900">Admin Settings</h3>
                            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-2">Manage global system configurations, security policies, and application preferences from this panel.</p>
                            <Button className="mt-6" variant="outline" disabled>Configure Settings</Button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
