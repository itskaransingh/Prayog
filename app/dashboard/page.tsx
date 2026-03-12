"use client";

import { useState, useEffect, useCallback } from "react";
import {
    LayoutDashboard,
    Users,
    Settings,
    ShieldCheck,
    ArrowLeft
} from "lucide-react";
import { CreateUserForm } from "@/components/admin/create-user-form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

type Tab = "overview" | "users" | "settings";

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>("users");
    const [users, setUsers] = useState<any[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

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

    useEffect(() => {
        if (activeTab === "users") {
            fetchUsers();
        }
    }, [activeTab, fetchUsers]);

    const tabs = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "users", label: "Users", icon: Users },
        { id: "settings", label: "Settings", icon: Settings },
    ];

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
                    {tabs.map((tab) => {
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
                            <p className="text-xs font-semibold text-slate-900">Administrator</p>
                            <p className="text-[10px] text-slate-500">Super Admin Access</p>
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
                                <p className="text-sm text-slate-500 max-w-xs mt-2">We're currently building out the detailed analytics and reporting modules for the admin panel.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === "users" && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1">
                                <CreateUserForm onSuccess={fetchUsers} />
                            </div>
                            <div className="lg:col-span-2 space-y-6">
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
                                                        <th className="px-6 py-3 font-medium">Email</th>
                                                        <th className="px-6 py-3 font-medium">Role</th>
                                                        <th className="px-6 py-3 font-medium">Created At</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {users.map((user) => (
                                                        <tr key={user.id} className="hover:bg-slate-50/50">
                                                            <td className="px-6 py-3 font-medium text-slate-900">{user.email}</td>
                                                            <td className="px-6 py-3">
                                                                <span className={`px-2.5 py-1 inline-flex text-[10px] leading-4 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                                    {user.role}
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
