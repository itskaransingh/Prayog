"use client";

import { PortalHeader } from "@/components/simulation/portal-header";
import { PortalFooter } from "@/components/simulation/portal-footer";
import Image from "next/image";

export default function GatewayPage() {
    return (
        <>
            <PortalHeader />
            <main className="sim-gateway-body">
                <div className="sim-gateway-content">
                    {/* Left Sidebar: Quick Links */}
                    <aside className="sim-quick-links-card">
                        <div className="sim-sidebar-title">Quick Links</div>
                        <nav className="sim-sidebar-list">
                            <SidebarItem icon="📝" label="e-Verify Return" />
                            <SidebarItem icon="🔍" label="Link Aadhaar Status" />
                            <SidebarItem icon="🔗" label="Link Aadhaar" />
                            <SidebarItem icon="📄" label="e-Pay Tax" />
                            <SidebarItem icon="📅" label="Income Tax Return (ITR) Status" />
                            <SidebarItem icon="🔑" label="Know Tax Payment Status" />
                            <SidebarItem icon="🆔" label="Know Your TAN" />
                            <SidebarItem icon="📋" label="Verify Your PAN" />
                            <SidebarItem icon="📈" label="Tax Calendar" />
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
                                        <button className="sim-btn-outline big" type="button" onClick={() => window.location.href = '/simulation'}>Register</button>
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

function SidebarItem({ icon, label }: { icon: string; label: string }) {
    return (
        <div className="sim-sidebar-item">
            <span className="sim-sidebar-icon">{icon}</span>
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
