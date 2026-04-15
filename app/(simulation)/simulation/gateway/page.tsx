"use client";

import { PortalHeader } from "@/components/simulation/income-tax/shared/portal-header";
import { PortalFooter } from "@/components/simulation/income-tax/shared/portal-footer";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";

export default function GatewayPage() {
    return (
        <Suspense fallback={<div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Loading Portal...</div>}>
            <GatewayContent />
        </Suspense>
    );
}

function GatewayContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const qId = searchParams?.get('questionId') || '6771ce37-57d3-479f-a57c-d53affa3264a';
    const registerHref = `/simulation?questionId=${qId}`;
    const epanHref = `/epan-simulation/gateway?questionId=${qId}`;

    const [currentSlide, setCurrentSlide] = useState(0);
    const banners = [
        { src: "/simulation/banner-new-1.webp", alt: "Income Tax Act 2025 Launch" },
        { src: "/simulation/banner-new-2.webp", alt: "e-Filing Portal Update" },
        { src: "/simulation/banner-new-3.webp", alt: "New Portal Banners" },
        { src: "/simulation/banner-new-4.webp", alt: "New Portal Banners 2" },
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % banners.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    return (
        <>
            <PortalHeader />
            <main className="sim-gateway-body-new">

                {/* Ticker / Notification Bar */}
                <div className="sim-ticker-bar">
                    <div className="sim-ticker-icon">
                        <Image src="/simulation/icons/quicklinks/nudge.svg" alt="notification" width={20} height={20} />
                    </div>
                    <div className="sim-ticker-track-wrap">
                        <div className="sim-ticker-track">
                            <span>1. Offline Utility for Form 145 and Form 146 has been enabled on the e-Filing Portal.</span>
                            <span className="sim-ticker-sep">|</span>
                            <span>2. Form No. 105, (earlier Form No.10AB) is now available for e-Filing.</span>
                            <span className="sim-ticker-sep">|</span>
                            <span>3. The Income Tax Act, 1961 stands repealed effective 01.04.2026, pursuant to Section 536 of the Income Tax Act, 2025.</span>
                            <span className="sim-ticker-sep">|</span>
                            <span>4. New challan forms are live on e-Filing portal for tax payments under the Income Tax Act, 2025.</span>
                            <span className="sim-ticker-sep">|</span>
                            <span>5. From 1st April 2026, Forms under Income Tax Act, 2025 will be available on the e‑Filing Portal.</span>
                            <span className="sim-ticker-sep">|</span>
                            <span>6. Forms applicable for Assessment Year 2026–27 are available under &quot;Forms as per Income-tax Act, 1961&quot; on the e-Filing portal from 1 April 2026.</span>
                            <span className="sim-ticker-sep">|</span>
                            <span>1. Offline Utility for Form 145 and Form 146 has been enabled on the e-Filing Portal.</span>
                            <span className="sim-ticker-sep">|</span>
                            <span>2. Form No. 105, (earlier Form No.10AB) is now available for e-Filing.</span>
                            <span className="sim-ticker-sep">|</span>
                            <span>3. The Income Tax Act, 1961 stands repealed effective 01.04.2026, pursuant to Section 536 of the Income Tax Act, 2025.</span>
                            <span className="sim-ticker-sep">|</span>
                            <span>4. New challan forms are live on e-Filing portal for tax payments under the Income Tax Act, 2025.</span>
                        </div>
                    </div>
                    <div className="sim-ticker-controls">
                        <button className="sim-ticker-btn" title="Pause">❚❚</button>
                    </div>
                </div>

                {/* Hero Carousel */}
                <section className="sim-hero-carousel">
                    <div className="sim-carousel-inner" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                        {banners.map((b, i) => (
                            <div key={i} className="sim-carousel-slide">
                                <Image
                                    src={b.src}
                                    alt={b.alt}
                                    fill
                                    style={{ objectFit: "cover" }}
                                    priority={i === 0}
                                />
                            </div>
                        ))}
                    </div>
                    <button
                        className="sim-carousel-arrow sim-carousel-prev"
                        onClick={() => setCurrentSlide(prev => (prev - 1 + banners.length) % banners.length)}
                        aria-label="Previous"
                    >&#8249;</button>
                    <button
                        className="sim-carousel-arrow sim-carousel-next"
                        onClick={() => setCurrentSlide(prev => (prev + 1) % banners.length)}
                        aria-label="Next"
                    >&#8250;</button>
                    <div className="sim-carousel-dots">
                        {banners.map((_, i) => (
                            <button
                                key={i}
                                className={`sim-carousel-dot${i === currentSlide ? " active" : ""}`}
                                onClick={() => setCurrentSlide(i)}
                                aria-label={`Slide ${i + 1}`}
                            />
                        ))}
                    </div>
                </section>

                {/* What's New Section */}
                <section className="sim-whats-new-section">
                    <div className="sim-ql-container">
                        <div className="sim-ql-header">
                            <div className="sim-ql-header-icon">
                                <Image src="/simulation/icons/quicklinks/nudge.svg" alt="whats new" width={28} height={28} />
                            </div>
                            <div>
                                <h2 className="sim-ql-title">What&apos;s New</h2>
                                <p className="sim-ql-subtitle">Stay updated with the latest announcements</p>
                            </div>
                        </div>
                        <div className="sim-whats-new-grid">
                            <WhatsNewCard
                                title="Rollout of Forms under Income Tax Rule, 2026"
                                body="To support the transition to the Income Tax Rules, 2026, the new Income Tax Forms have been made available on the e‑Filing portal. New Forms can be accessed via: e-File → Income Tax Forms → File Income Tax Forms → Forms under Income Tax Act, 2025."
                            />
                            <WhatsNewCard
                                title="New Integrated Payment Module Goes Live on e‑Filing Portal"
                                body="Seamless payments now enabled across both the Income‑tax Act, 1961 and the Income‑tax Act, 2025. Taxpayers can conveniently make payments under the existing Income‑tax Act, 1961 for dues up to FY 2025‑26, as well as for Tax Year 2026‑27 onwards — all from a single interface."
                            />
                        </div>
                    </div>
                </section>

                {/* Quick Links Section */}
                <section className="sim-quicklinks-section">
                    <div className="sim-ql-container">
                        <div className="sim-ql-header">
                            <div className="sim-ql-header-icon">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#29398D" strokeWidth="1.5">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                </svg>
                            </div>
                            <div>
                                <h2 className="sim-ql-title">Quick Links</h2>
                                <p className="sim-ql-subtitle">Access all services at your fingertips</p>
                            </div>
                        </div>

                        <div className="sim-quicklinks-grid">
                            <QuickLinkCard iconSrc="/simulation/icons/quicklinks/nudge.svg"               label="NUDGE Campaign" />
                            <QuickLinkCard iconSrc="/simulation/icons/quicklinks/epay-tax.svg"            label="e-Pay Tax" />
                            <Link href={epanHref} className="sim-quicklink-card-link">
                                <QuickLinkCard iconSrc="/simulation/icons/quicklinks/instant-epan.svg"    label="Instant E-PAN" />
                            </Link>
                            <QuickLinkCard iconSrc="/simulation/icons/quicklinks/know-your-jao.svg"       label="Know Your JAO" />
                            <QuickLinkCard iconSrc="/simulation/icons/quicklinks/verify-service-request.svg" label="Verify Service Request" />
                            <QuickLinkCard iconSrc="/simulation/icons/quicklinks/report-account-misuse.svg"  label="Report Account Misuse" />
                            <QuickLinkCard iconSrc="/simulation/icons/quicklinks/verify-pan.svg"          label="Verify PAN Status" />
                            <QuickLinkCard iconSrc="/simulation/icons/quicklinks/income-tax-calculator.svg" label="Income Tax Calculator" />
                            <QuickLinkCard iconSrc="/simulation/icons/quicklinks/know-tan-details.svg"    label="Know TAN Details" />
                            <QuickLinkCard iconSrc="/simulation/icons/quicklinks/e-verify-return.svg"     label="e-Verify Return" />
                            <QuickLinkCard iconSrc="/simulation/icons/quicklinks/know-payment-status.svg" label="Know Tax Payment Status" />
                            <QuickLinkCard iconSrc="/simulation/icons/quicklinks/tax-calendar.svg"        label="Tax Calendar" />
                            <QuickLinkCard iconSrc="/simulation/icons/quicklinks/tax-info-services.svg"   label="Tax Information &amp; Services" />
                            <QuickLinkCard iconSrc="/simulation/icons/quicklinks/download-csi-file.svg"   label="Download CSI File" />
                            <QuickLinkCard iconSrc="/simulation/icons/quicklinks/comply-to-notice.svg"    label="Comply to Notice" />
                        </div>
                    </div>
                </section>

            </main>
            <PortalFooter />
        </>
    );
}

function WhatsNewCard({ title, body }: { title: string; body: string }) {
    return (
        <div className="sim-whats-new-card">
            <div className="sim-whats-new-indicator" />
            <div className="sim-whats-new-content">
                <h3 className="sim-whats-new-title">{title}</h3>
                <p className="sim-whats-new-body">{body}</p>
            </div>
        </div>
    );
}

function QuickLinkCard({ iconSrc, label }: { iconSrc: string; label: string }) {
    return (
        <div className="sim-quicklink-card">
            <div className="sim-quicklink-icon">
                <Image src={iconSrc} alt={label} width={64} height={64} />
            </div>
            <span className="sim-quicklink-label">{label}</span>
        </div>
    );
}
