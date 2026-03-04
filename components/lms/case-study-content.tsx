import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Target, Lightbulb, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CaseStudyContent() {
    return (
        <div className="flex flex-1 flex-col gap-6 p-6 pb-24">
            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    Case Study: ITR Registration
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Registration &gt; ITR Registration
                </p>
            </div>

            <Separator />

            {/* Scenario Card */}
            <Card className="border-primary/20 bg-linear-to-br from-primary/5 to-transparent">
                <CardHeader className="flex flex-row items-center gap-3 pb-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="size-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">The Scenario</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Read this carefully before starting the task
                        </p>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm leading-relaxed text-foreground/90">
                        <strong>Mr. Rajesh Kumar</strong>, a 32-year-old salaried employee
                        working at Infosys Ltd., Bengaluru, needs to register on the
                        Income Tax e-Filing portal for the first time. He has his PAN card
                        (ABCPK1234D), Aadhaar card, bank account details, and a registered
                        mobile number. Your task is to help him complete the{" "}
                        <strong>new user registration process</strong> on the Income Tax
                        portal so that he can file his returns for AY 2025-26.
                    </p>
                </CardContent>
            </Card>

            {/* Two-column info */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Learning Objectives */}
                <Card>
                    <CardHeader className="flex flex-row items-center gap-3 pb-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                            <Target className="size-5" />
                        </div>
                        <CardTitle className="text-base">Learning Objectives</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-500" />
                                Understand the ITR e-Filing portal interface
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-500" />
                                Navigate the new user registration flow
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-500" />
                                Validate PAN and Aadhaar details correctly
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-500" />
                                Complete OTP verification steps
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Key Information */}
                <Card>
                    <CardHeader className="flex flex-row items-center gap-3 pb-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                            <Lightbulb className="size-5" />
                        </div>
                        <CardTitle className="text-base">Key Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="text-xs font-medium uppercase text-muted-foreground">
                                Client Details
                            </p>
                            <p className="text-sm">Mr. Rajesh Kumar &bull; PAN: ABCPK1234D</p>
                        </div>
                        <Separator />
                        <div>
                            <p className="text-xs font-medium uppercase text-muted-foreground">
                                Portal
                            </p>
                            <p className="text-sm">Income Tax e-Filing Portal (incometax.gov.in)</p>
                        </div>
                        <Separator />
                        <div>
                            <p className="text-xs font-medium uppercase text-muted-foreground">
                                Documents Required
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                                <Badge variant="secondary" className="text-xs">PAN Card</Badge>
                                <Badge variant="secondary" className="text-xs">Aadhaar Card</Badge>
                                <Badge variant="secondary" className="text-xs">Bank Details</Badge>
                                <Badge variant="secondary" className="text-xs">Mobile Number</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Question Section */}
            <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader className="flex flex-row items-center gap-3 pb-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500 text-white">
                        <span className="text-lg font-bold">?</span>
                    </div>
                    <div>
                        <CardTitle className="text-lg text-blue-900">Question: Registration Details</CardTitle>
                        <p className="text-sm text-blue-700/70">
                            Use the following details to complete the registration simulation
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Personal & Portal Details */}
                        <div className="space-y-4">
                            <div>
                                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-800/60">
                                    Personal Details
                                </h4>
                                <div className="grid grid-cols-2 gap-y-2 text-sm">
                                    <span className="text-muted-foreground">First Name:</span>
                                    <span className="font-medium">Rajesh</span>
                                    <span className="text-muted-foreground">Middle Name:</span>
                                    <span className="font-medium">---</span>
                                    <span className="text-muted-foreground">Last Name:</span>
                                    <span className="font-medium">Kumar</span>
                                    <span className="text-muted-foreground">Date of Birth:</span>
                                    <span className="font-medium">15/08/1993</span>
                                    <span className="text-muted-foreground">Gender:</span>
                                    <span className="font-medium">Male</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-800/60">
                                    Contact Details
                                </h4>
                                <div className="grid grid-cols-2 gap-y-2 text-sm">
                                    <span className="text-muted-foreground">Mobile Number:</span>
                                    <span className="font-medium">9876543210</span>
                                    <span className="text-muted-foreground">Email ID:</span>
                                    <span className="font-medium">rajesh.kumar@email.com</span>
                                    <span className="text-muted-foreground">Alt. Contact:</span>
                                    <span className="font-medium">---</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-800/60">
                                    Other Info
                                </h4>
                                <div className="grid grid-cols-2 gap-y-2 text-sm">
                                    <span className="text-muted-foreground">PAN:</span>
                                    <span className="font-medium">ABCPK1234D</span>
                                    <span className="text-muted-foreground">Employer:</span>
                                    <span className="font-medium">Infosys Ltd.</span>
                                </div>
                            </div>
                        </div>

                        {/* Address Details */}
                        <div>
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-800/60">
                                Address Details
                            </h4>
                            <div className="space-y-2 rounded-lg border border-blue-100 bg-white p-3 text-sm shadow-xs">
                                <div className="grid grid-cols-[100px_1fr] gap-y-1.5">
                                    <span className="text-muted-foreground">Flat/Door:</span>
                                    <span className="font-medium">Flat 302</span>
                                    <span className="text-muted-foreground">Building:</span>
                                    <span className="font-medium">Prestige Towers</span>
                                    <span className="text-muted-foreground">Road/Street:</span>
                                    <span className="font-medium">Koramangala</span>
                                    <span className="text-muted-foreground">Area/Locality:</span>
                                    <span className="font-medium">Koramangala</span>
                                    <span className="text-muted-foreground">City/Town:</span>
                                    <span className="font-medium">Bengaluru</span>
                                    <span className="text-muted-foreground">State:</span>
                                    <span className="font-medium">Karnataka</span>
                                    <span className="text-muted-foreground">Pincode:</span>
                                    <span className="font-medium">560034</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Hint Section */}
            <Card className="border-dashed">
                <CardHeader className="flex flex-row items-center gap-3 pb-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                        <BookOpen className="size-5" />
                    </div>
                    <CardTitle className="text-base">Before You Begin</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        In the next step, you will enter a simulated version of the Income Tax
                        e-Filing portal. The simulation closely mirrors the actual government website.
                        Follow the on-screen instructions carefully, fill in the required data using
                        the client details provided above, and complete each step of the registration
                        process. A guide panel will be available to assist you if you get stuck.
                    </p>
                </CardContent>
            </Card>

            {/* Action Bar at Bottom */}
            <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/80 p-4 backdrop-blur-md md:left-64">
                <div className="mx-auto flex max-w-5xl items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-900">Ready to begin?</p>
                        <p className="text-xs text-muted-foreground">This task will take approximately 15-20 minutes.</p>
                    </div>
                    <Link href="/simulation/gateway">
                        <Button size="lg" className="gap-2 px-8 font-bold">
                            Start Task <ArrowRight className="size-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
