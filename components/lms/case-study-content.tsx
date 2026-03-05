 "use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "lucide-react";
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

            {/* Question Paragraph */}
            <Card className="border-blue-200 bg-blue-50/30">
                <CardContent className="pt-6">
                    <p className="text-lg leading-relaxed text-blue-900">
                        Rajesh Kumar is an individual with incomes from various sources that exceed the basic exemption limit. He needs to register under income tax. Registering on the e-Filing portal will enable him to access and use the various functionalities and tax-related services that the e-Filing portal offers. He has provided you with the following information. As you are a tax practitioner, advise him to register under income tax.
                    </p>
                </CardContent>
            </Card>

            {/* Details for Registration Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Details for Registration</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300">
                            <tbody>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">PAN:</td>
                                    <td className="border border-gray-300 px-4 py-2">ABCPK1234D</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">Legal Status:</td>
                                    <td className="border border-gray-300 px-4 py-2">Individual</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">Name:</td>
                                    <td className="border border-gray-300 px-4 py-2">Rajesh Kumar</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">Gender:</td>
                                    <td className="border border-gray-300 px-4 py-2">Male</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">Residential Status:</td>
                                    <td className="border border-gray-300 px-4 py-2">Resident</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">Date of Birth:</td>
                                    <td className="border border-gray-300 px-4 py-2">15/08/1993</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">Mobile No:</td>
                                    <td className="border border-gray-300 px-4 py-2">9876543210</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">Email ID:</td>
                                    <td className="border border-gray-300 px-4 py-2">rajesh.kumar@email.com</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">Flat/Door/Building:</td>
                                    <td className="border border-gray-300 px-4 py-2">Flat 302</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">Road/Street/Block/Sector:</td>
                                    <td className="border border-gray-300 px-4 py-2">Koramangala</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">Area/Locality:</td>
                                    <td className="border border-gray-300 px-4 py-2">Koramangala</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">Town/City/District:</td>
                                    <td className="border border-gray-300 px-4 py-2">Bengaluru</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">State:</td>
                                    <td className="border border-gray-300 px-4 py-2">Karnataka</td>
                                </tr>
                                <tr>
                                    <td className="border border-gray-300 px-4 py-2 font-medium bg-gray-50">Pin Code:</td>
                                    <td className="border border-gray-300 px-4 py-2">560034</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Action Bar at Bottom */}
            <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/80 p-4 backdrop-blur-md md:left-64">
                <div className="mx-auto flex max-w-5xl items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-900">Ready to begin?</p>
                        <p className="text-xs text-muted-foreground">This task will take approximately 15-20 minutes.</p>
                    </div>
                    <Button
                        size="lg"
                        className="gap-2 px-8 font-bold"
                        onClick={() => {
                            if (typeof window === "undefined") return;
                            try {
                                window.localStorage.setItem(
                                    "itr-registration-started",
                                    "true",
                                );
                            } catch {
                                // ignore storage errors
                            }
                            window.open(
                                "/simulation/gateway",
                                "_blank",
                                "noopener,noreferrer",
                            );
                        }}
                    >
                        Start Task <ArrowRight className="size-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
