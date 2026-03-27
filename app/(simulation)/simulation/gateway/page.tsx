"use client";

import { PortalHeader } from "@/components/simulation/income-tax/shared/portal-header";
import { PortalFooter } from "@/components/simulation/income-tax/shared/portal-footer";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function GatewayPage() {
    return (
        <Suspense fallback={<div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Loading Portal...</div>}>
            <GatewayContent />
        </Suspense>
    );
}

function GatewayContent() {
    const searchParams = useSearchParams();
    const qId = searchParams?.get('questionId') || '6771ce37-57d3-479f-a57c-d53affa3264a'; // fallback to first Priya Nambiar ID for direct testing
    const registerHref = `/simulation?questionId=${qId}`;

    return (
        <>
            <PortalHeader />
            <main className="sim-gateway-body">
                <div className="sim-gateway-content">
                    {/* Left Sidebar: Quick Links */}
                    <aside className="sim-quick-links-card">
                        <div className="sim-sidebar-title">Quick Links</div>
                        <nav className="sim-sidebar-list" aria-label="Quick Links">
                            <SidebarItem
                                iconSrc="/simulation/icons/Income-tax-menu-icons/e-_Verify_Return.svg"
                                label="e- Verify Return"
                            />
                            <SidebarItem
                                iconSrc="/simulation/icons/Income-tax-menu-icons/Link_Aadhaar.svg"
                                label="Link Aadhaar"
                            />
                            <SidebarItem
                                iconSrc="/simulation/icons/Income-tax-menu-icons/Link_Aadhaar_Status.svg"
                                label="Link Aadhaar Status"
                            />
                            <SidebarItem
                                iconSrc="/simulation/icons/Income-tax-menu-icons/e-Pay_Tax.svg"
                                label="e-Pay Tax"
                            />
                            <SidebarItem
                                iconSrc="/simulation/icons/Income-tax-menu-icons/Income_Tax_Calculator.svg"
                                label="Income Tax Return (ITR) Status"
                            />
                            <SidebarItem
                                iconSrc="/simulation/icons/Income-tax-menu-icons/Verify_PAN_Status.svg"
                                label="Verify Your PAN"
                            />
                            <SidebarItem
                                iconSrc="/simulation/icons/Income-tax-menu-icons/Know_TAN_Details.svg"
                                label="Know TAN Details"
                            />
                            <SidebarItem
                                iconSrc="/simulation/icons/Income-tax-menu-icons/Tax_Information_&_services.svg"
                                label="Tax Information & services"
                            />
                            <SidebarItem
                                iconSrc="/simulation/icons/Income-tax-menu-icons/Authenticate_notice-order_issued_by_ITD.svg"
                                label="Authenticate notice/order issued by ITD"
                            />
                            <SidebarItem
                                iconSrc="/simulation/icons/Income-tax-menu-icons/Know_your_JAO.svg"
                                label="Know Your AO"
                            />
                            <div 
                                onClick={() => window.location.href = `/epan-simulation/gateway?questionId=${qId}`}
                                style={{ cursor: 'pointer' }}
                            >
                                <SidebarItem
                                    iconSrc="/simulation/icons/Income-tax-menu-icons/Instant_E-PAN.svg"
                                    label="Instant E-PAN"
                                />
                            </div>
                            <SidebarItem
                                iconSrc="/simulation/icons/Income-tax-menu-icons/TDS_On_Cash_Withdrawal.svg"
                                label="TDS On Cash Withdrawal"
                            />
                            <SidebarItem
                                iconSrc="/simulation/icons/Income-tax-menu-icons/Report_Account_Misuse.svg"
                                label="Account Misuse"
                            />
                        </nav>
                    </aside>

                    {/* Main Area */}
                    <div className="sim-main-area">
                        {/* Hero Section with Banner and Login/Register Overlay */}
                        <section className="sim-hero-section">
                            <div className="sim-hero-banner">
                                <div className="sim-hero-overlay">
                                    <h2>e-Filing Anywhere, Anytime!</h2>
                                    <p>Experience the new e-Filing portal 2.0</p>
                                    <div className="sim-hero-actions">
                                        <button className="sim-btn-filled big" type="button">Login</button>
                                        <button className="sim-btn-outline big" type="button" onClick={() => window.location.href = registerHref}>Register</button>
                                    </div>
                                </div>
                                <Image
                                    src="/simulation/banner1.png"
                                    alt="Income Tax Portal Banner"
                                    className="sim-hero-img"
                                    width={1320}
                                    height={400}
                                    priority
                                />
                            </div>
                        </section>

                        {/* Info Cards Grid */}
                        <div className="sim-info-grid">
                            <InfoCard
                                icon="👤"
                                title="Individual/HUF"
                                description="Salaried, Professionals, and Business Owners."
                            />
                            <InfoCard
                                icon="🏢"
                                title="Company"
                                description="Domestic and Foreign Companies."
                            />
                            <InfoCard
                                icon="👥"
                                title="Non-Company"
                                description="Firms, LLPs, AOPs, and BOIs."
                            />
                            <InfoCard
                                icon="👨‍💼"
                                title="Tax Professionals"
                                description="Chartered Accountants and External Reporting Agencies."
                            />
                        </div>
                    </div>
                </div>
            </main>
            <PortalFooter />
        </>
    );
}

type SidebarItemProps = {
    iconSrc: string;
    label: string;
};

function SidebarItem({ iconSrc, label }: SidebarItemProps) {
    return (
        <div className="sim-sidebar-item">
            <span className="sim-sidebar-icon">
                <Image
                    src={iconSrc}
                    alt={label}
                    width={24}
                    height={24}
                />
            </span>
            <span>{label}</span>
        </div>
    );
}

function InfoCard({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div className="sim-gateway-card">
            <div className="sim-card-icon-box">{icon}</div>
            <div className="sim-card-content">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
        </div>
    );
}
