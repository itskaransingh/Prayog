"use client";

import { PortalHeader } from "@/components/simulation/income-tax/shared/portal-header";
import { PortalFooter } from "@/components/simulation/income-tax/shared/portal-footer";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { EPANDashboard } from "@/components/simulation/income-tax/epan-registration/epan-dashboard";

export default function GatewayPage() {
    return (
        <Suspense fallback={<div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Loading Portal...</div>}>
            <GatewayContent />
        </Suspense>
    );
}

function GatewayContent() {
    const searchParams = useSearchParams();
    const qId = searchParams?.get('questionId');

    return (
        <div className="flex flex-col min-h-screen font-sans bg-[#f6f8fc]">
            <PortalHeader />
            <main className="flex-grow py-8">
                <EPANDashboard 
                    onGetNewEPAN={() => {
                        if (!qId) {
                            alert("No e-PAN question was selected. Please return to the LMS and start the task again.");
                            return;
                        }

                        window.location.href = `/epan-simulation?questionId=${qId}`;
                    }}
                    onCheckStatus={() => alert("Check Status/Download PAN simulation not implemented.")}
                />
            </main>
            <PortalFooter />
        </div>
    );
}
