"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus, CheckCircle2, AlertCircle } from "lucide-react";
import {
    Combobox,
    ComboboxInput,
    ComboboxContent,
    ComboboxList,
    ComboboxItem,
    ComboboxEmpty,
    ComboboxChips,
    ComboboxChip,
    ComboboxCollection,
} from "@/components/ui/combobox";

interface Course {
    id: string;
    title: string;
}

interface UserRole {
    value: string;
    label: string;
}

const ALL_ROLES: UserRole[] = [
    { value: "super_admin", label: "Super Admin" },
    { value: "admin", label: "Admin" },
    { value: "faculty", label: "Faculty" },
    { value: "student", label: "Student" },
];

const ADMIN_CREATABLE_ROLES: UserRole[] = [
    { value: "faculty", label: "Faculty" },
    { value: "student", label: "Student" },
];

export function CreateUserForm({ onSuccess, userRole }: { onSuccess?: () => void; userRole?: string }) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("student");
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [availableRoles, setAvailableRoles] = useState<UserRole[]>(ALL_ROLES);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingCourses, setIsFetchingCourses] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const isAdmin = userRole === "admin";
    const showCourseAccess = role === "faculty" || role === "student";

    useEffect(() => {
        if (isAdmin) {
            setAvailableRoles(ADMIN_CREATABLE_ROLES);
            if (role === "super_admin" || role === "admin") {
                setRole("faculty");
            }
        } else {
            setAvailableRoles(ALL_ROLES);
        }
    }, [isAdmin, role]);

    useEffect(() => {
        if (showCourseAccess) {
            fetchCourses();
        }
    }, [showCourseAccess]);

    const fetchCourses = async () => {
        setIsFetchingCourses(true);
        try {
            const response = await fetch("/api/admin/courses");
            const data = await response.json();
            if (response.ok) {
                setCourses(data.courses || []);
            }
        } catch (error) {
            console.error("Failed to fetch courses:", error);
        } finally {
            setIsFetchingCourses(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            const response = await fetch("/api/admin/create-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    password,
                    role,
                    courseAccess: showCourseAccess ? selectedCourses : [],
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create user");
            }

            setMessage({ type: "success", text: "User created successfully!" });
            setFullName("");
            setEmail("");
            setPassword("");
            setRole(isAdmin ? "faculty" : "student");
            setSelectedCourses([]);
            if (onSuccess) {
                onSuccess();
            }
        } catch (error: unknown) {
            setMessage({
                type: "error",
                text: error instanceof Error ? error.message : "Failed to create user",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md border-border/50 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-blue-600" />
                    Create New User
                </CardTitle>
                <CardDescription>
                    Add a new user to the system with a specific role.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="full-name">Full Name</Label>
                        <Input
                            id="full-name"
                            type="text"
                            placeholder="Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Min 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                            value={role}
                            onValueChange={setRole}
                            disabled={isLoading}
                        >
                            <SelectTrigger id="role">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableRoles.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {showCourseAccess && (
                        <div className="space-y-2">
                            <Label>Course Access</Label>
                            <Combobox multiple value={selectedCourses} onValueChange={setSelectedCourses}>
                                <ComboboxInput placeholder="Select courses..." disabled={isLoading || isFetchingCourses} />
                                <ComboboxContent>
                                    <ComboboxList>
                                        {courses.map((course) => (
                                            <ComboboxItem key={course.id} value={course.id}>
                                                {course.title}
                                            </ComboboxItem>
                                        ))}
                                        <ComboboxEmpty>No courses found</ComboboxEmpty>
                                    </ComboboxList>
                                </ComboboxContent>
                                {selectedCourses.length > 0 && (
                                    <ComboboxChips>
                                        {selectedCourses.map((courseId) => {
                                            const course = courses.find((c) => c.id === courseId);
                                            return course ? (
                                                <ComboboxChip key={courseId} value={courseId}>
                                                    {course.title}
                                                </ComboboxChip>
                                            ) : null;
                                        })}
                                    </ComboboxChips>
                                )}
                            </Combobox>
                        </div>
                    )}

                    {message && (
                        <div className={`p-3 rounded-md flex items-center gap-2 text-sm ${message.type === "success"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                            }`}>
                            {message.type === "success" ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <AlertCircle className="h-4 w-4" />
                            )}
                            {message.text}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create User"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
